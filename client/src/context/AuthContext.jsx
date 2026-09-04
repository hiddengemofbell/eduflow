import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient, supabase } from '../lib/supabase';

const AuthContext = createContext();

const parseJsonResponse = async (res) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: 'Server connection error. Please try again.' };
  }
};

const getEmailRedirectUrl = () => {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim();
  return new URL('/', configuredSiteUrl || window.location.origin).toString();
};

const isPasswordRecoveryRedirect = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return query.get('recovery') === '1' || query.get('type') === 'recovery' || hash.get('type') === 'recovery';
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(isPasswordRecoveryRedirect);

  const token = session?.access_token || null;
  const authUserId = session?.user?.id || null;

  useEffect(() => {
    localStorage.removeItem('eduflow_token');

    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('Failed to restore Supabase session:', error.message);
      setSession(data?.session || null);
      if (!data?.session) setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
        setUser(null);
      }
      setSession(nextSession);
      if (!nextSession) {
        setUser(null);
        setMfaRequired(false);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!token || passwordRecovery) {
      if (passwordRecovery) {
        setUser(null);
        setMfaRequired(false);
        setLoading(false);
      }
      return undefined;
    }

    const controller = new AbortController();

    const loadUser = async () => {
      setLoading(true);
      try {
        const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(token);
        if (assurance.error) throw assurance.error;

        if (assurance.data.currentLevel === 'aal1' && assurance.data.nextLevel === 'aal2') {
          setUser(null);
          setMfaRequired(true);
          return;
        }

        setMfaRequired(false);
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        const data = await parseJsonResponse(res);

        if (!res.ok) {
          throw new Error(data.message || 'Unable to load your EduFlow profile.');
        }
        setUser(data.user);
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Failed to load user session:', error.message);
        setUser(null);
        await supabase.auth.signOut({ scope: 'local' });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadUser();
    return () => controller.abort();
  }, [passwordRecovery, token]);

  const login = async (email, password, captchaToken) => {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
      options: captchaToken ? { captchaToken } : undefined
    });

    if (error) throw new Error(error.message || 'Login failed.');
    return data.user;
  };

  const register = async (formData) => {
    const client = getSupabaseClient();
    const normalizedJoinCode = formData.join_code?.trim().toUpperCase() || '';
    const requestedType = normalizedJoinCode ? 'ORG_MEMBER' : formData.account_type;
    const { data, error } = await client.auth.signUp({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      options: {
        emailRedirectTo: getEmailRedirectUrl(),
        captchaToken: formData.captchaToken || undefined,
        data: {
          name: formData.name.trim(),
          account_type: requestedType,
          join_code: normalizedJoinCode,
          org_name: formData.org_name?.trim() || ''
        }
      }
    });

    if (error) throw new Error(error.message || 'Registration failed.');

    return {
      user: data.user,
      requiresEmailConfirmation: !data.session
    };
  };

  const requestPasswordReset = async (email, captchaToken) => {
    const client = getSupabaseClient();
    const redirectUrl = new URL('/?recovery=1', getEmailRedirectUrl()).toString();
    const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl,
      captchaToken: captchaToken || undefined
    });
    if (error) throw new Error(error.message || 'Unable to send the password reset email.');
  };

  const completePasswordRecovery = async (newPassword) => {
    const client = getSupabaseClient();
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message || 'Unable to update your password.');

    await client.auth.signOut({ scope: 'global' });
    setPasswordRecovery(false);
    setSession(null);
    setUser(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const signInWithPasskey = async (captchaToken) => {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPasskey({
      options: captchaToken ? { captchaToken } : undefined
    });
    if (error) throw new Error(error.message || 'Passkey sign-in failed.');
    return data.user;
  };

  const verifyMfa = async (code) => {
    const client = getSupabaseClient();
    const factors = await client.auth.mfa.listFactors();
    if (factors.error) throw new Error(factors.error.message);
    const factor = factors.data.totp[0];
    if (!factor) throw new Error('No verified authenticator factor was found.');

    const verification = await client.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: code.trim()
    });
    if (verification.error) throw new Error(verification.error.message || 'Invalid verification code.');

    const { data: sessionData } = await client.auth.getSession();
    setMfaRequired(false);
    setSession(sessionData.session);
  };

  const listMfaFactors = async () => {
    const result = await getSupabaseClient().auth.mfa.listFactors();
    if (result.error) throw new Error(result.error.message);
    return result.data;
  };

  const startMfaEnrollment = async () => {
    const result = await getSupabaseClient().auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'EduFlow authenticator'
    });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  };

  const verifyMfaEnrollment = async (factorId, code) => {
    const client = getSupabaseClient();
    const result = await client.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim()
    });
    if (result.error) throw new Error(result.error.message);
    const { data: sessionData } = await client.auth.getSession();
    setSession(sessionData.session);
    return result.data;
  };

  const unenrollMfa = async (factorId) => {
    const result = await getSupabaseClient().auth.mfa.unenroll({ factorId });
    if (result.error) throw new Error(result.error.message);
  };

  const listPasskeys = async () => {
    const result = await getSupabaseClient().auth.passkey.list();
    if (result.error) throw new Error(result.error.message);
    return result.data || [];
  };

  const registerPasskey = async () => {
    const result = await getSupabaseClient().auth.registerPasskey();
    if (result.error) throw new Error(result.error.message || 'Unable to register this passkey.');
    return result.data;
  };

  const deletePasskey = async (passkeyId) => {
    const result = await getSupabaseClient().auth.passkey.delete({ passkeyId });
    if (result.error) throw new Error(result.error.message || 'Unable to remove this passkey.');
  };

  const logout = async () => {
    localStorage.removeItem('eduflow_token');
    localStorage.removeItem('eduflow_offline_tasks');
    setUser(null);
    setSession(null);
    setMfaRequired(false);
    setPasswordRecovery(false);

    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Supabase sign out failed:', error.message);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.message || 'Failed to refresh your profile.');
    setUser(data.user);
  };

  const joinOrganization = async (join_code) => {
    const res = await fetch('/api/organizations/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ join_code })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.message || 'Failed to join organization.');
    await refreshUser();
    return data;
  };

  const createOrganization = async (name) => {
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.message || 'Failed to create organization.');
    await refreshUser();
    return data;
  };

  const value = useMemo(() => ({
    user,
    authUserId,
    token,
    loading,
    mfaRequired,
    passwordRecovery,
    login,
    register,
    requestPasswordReset,
    completePasswordRecovery,
    signInWithPasskey,
    verifyMfa,
    listMfaFactors,
    startMfaEnrollment,
    verifyMfaEnrollment,
    unenrollMfa,
    listPasskeys,
    registerPasskey,
    deletePasskey,
    logout,
    joinOrganization,
    createOrganization,
    isAuthenticated: Boolean(user)
  }), [authUserId, loading, mfaRequired, passwordRecovery, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
