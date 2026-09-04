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

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = session?.access_token || null;

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

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const controller = new AbortController();

    const loadUser = async () => {
      setLoading(true);
      try {
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
  }, [token]);

  const login = async (email, password) => {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
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

  const logout = async () => {
    localStorage.removeItem('eduflow_token');
    localStorage.removeItem('eduflow_offline_tasks');
    setUser(null);
    setSession(null);

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
    token,
    loading,
    login,
    register,
    logout,
    joinOrganization,
    createOrganization,
    isAuthenticated: Boolean(user)
  }), [loading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
