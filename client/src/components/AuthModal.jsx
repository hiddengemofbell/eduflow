import React, { useEffect, useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useAuth } from '../context/AuthContext';
import { X, KeyRound, Lock, Mail, User, Shield, Users } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onRegistered, initialMode = 'login' }) {
  const { login, register, requestPasswordReset, signInWithPasskey } = useAuth();
  const captchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY?.trim();
  const captchaRef = useRef(null);

  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('INDIVIDUAL');
  const [joinCode, setJoinCode] = useState('');
  const [orgName, setOrgName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setConfirmationEmail('');
      setResetEmail('');
      setCaptchaToken('');
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (captchaSiteKey && !captchaToken) {
        throw new Error('Complete the CAPTCHA challenge before continuing.');
      } else if (mode === 'forgot') {
        await requestPasswordReset(email, captchaToken);
        setResetEmail(email.trim());
      } else if (mode === 'login') {
        await login(email, password, captchaToken);
        onClose();
      } else {
        const result = await register({
          name,
          email,
          password,
          account_type: accountType,
          join_code: joinCode,
          org_name: orgName,
          captchaToken
        });
        onRegistered?.(result.user?.id);
        if (result.requiresEmailConfirmation) {
          setConfirmationEmail(email.trim());
          setPassword('');
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
      setLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setError('');
    setLoading(true);
    try {
      if (captchaSiteKey && !captchaToken) {
        throw new Error('Complete the CAPTCHA challenge before using a passkey.');
      }
      await signInWithPasskey(captchaToken);
      onClose();
    } catch (err) {
      setError(err.message || 'Passkey sign-in failed.');
    } finally {
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
      setLoading(false);
    }
  };

  const title = mode === 'login'
    ? 'Welcome Back!'
    : mode === 'register'
      ? 'Create Your Account'
      : 'Reset Your Password';

  const subtitle = mode === 'login'
    ? 'Sign in to access your student task dashboard'
    : mode === 'register'
      ? 'Join EduFlow to organize all your responsibilities'
      : 'We will email you a secure password reset link';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B3D]/70 dark:bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1E142D] w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-[#332352] overflow-hidden transform animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#CDB4DB]/40 via-[#FFC8DD]/40 to-[#BDE0FE]/40 dark:from-[#2B1B3D] dark:to-[#382550] p-6 relative text-center border-b border-gray-100 dark:border-[#332352]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#2B1B3D] dark:text-gray-300 hover:bg-white/60 dark:hover:bg-[#332352] p-1.5 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>

          <img src="/logo.png" alt="EduFlow Logo" className="w-14 h-14 object-contain mx-auto mb-2 drop-shadow" />

          <h2 className="text-2xl font-black text-[#2B1B3D] dark:text-white">
            {title}
          </h2>
          <p className="text-xs font-bold text-gray-600 dark:text-[#FFC8DD] mt-1">
            {subtitle}
          </p>

          {/* Mode Switcher */}
          <div className="flex bg-white/70 dark:bg-[#120B1D] p-1 rounded-2xl mt-4 border border-white/60 dark:border-[#332352]">
            <button
              onClick={() => { setMode('login'); setError(''); setConfirmationEmail(''); setResetEmail(''); }}
              className={`flex-1 py-2 font-black text-xs rounded-xl transition ${
                mode === 'login' ? 'bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D] shadow' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setConfirmationEmail(''); setResetEmail(''); }}
              className={`flex-1 py-2 font-black text-xs rounded-xl transition ${
                mode === 'register' ? 'bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D] shadow' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {confirmationEmail && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#2B1B3D] dark:text-white">Check your email</h3>
                <p className="mt-2 text-xs font-medium leading-5 text-gray-600 dark:text-gray-300">
                  We sent a confirmation link to <strong>{confirmationEmail}</strong>. Open it to verify your address and return to EduFlow.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-[#FFC8DD] py-3 text-xs font-black text-[#2B1B3D] shadow transition hover:bg-[#FFAFCC]"
              >
                Got it
              </button>
            </div>
          )}

          {resetEmail && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#2B1B3D] dark:text-white">Check your email</h3>
                <p className="mt-2 text-xs font-medium leading-5 text-gray-600 dark:text-gray-300">
                  If an account exists for <strong>{resetEmail}</strong>, a secure reset link has been sent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setMode('login'); setResetEmail(''); }}
                className="w-full rounded-2xl bg-[#FFC8DD] py-3 text-xs font-black text-[#2B1B3D] shadow transition hover:bg-[#FFAFCC]"
              >
                Back to sign in
              </button>
            </div>
          )}

          {!confirmationEmail && !resetEmail && (
            <>
          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g., Belle Student"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 dark:border-[#332352] dark:bg-[#120B1D] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                maxLength={254}
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 dark:border-[#332352] dark:bg-[#120B1D] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD]"
              />
            </div>
          </div>

          {mode !== 'forgot' && <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={8}
                maxLength={72}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 dark:border-[#332352] dark:bg-[#120B1D] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD]"
              />
            </div>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setPassword(''); setCaptchaToken(''); }}
                className="mt-2 text-[11px] font-bold text-[#6D4C7D] dark:text-[#FFC8DD] hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>}

          {mode === 'register' && (
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-[#332352]">
              <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType('INDIVIDUAL')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    accountType === 'INDIVIDUAL'
                      ? 'border-[#2B1B3D] dark:border-[#FFC8DD] bg-[#FFC8DD]/20 dark:bg-[#382550]'
                      : 'border-gray-200 dark:border-[#332352] bg-white dark:bg-[#120B1D]'
                  }`}
                >
                  <Users className="w-5 h-5 text-[#2B1B3D] dark:text-[#FFC8DD] mb-1" />
                  <div className="text-xs font-black text-[#2B1B3D] dark:text-white">Individual Student</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Personal & Academic Tasks</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('ORG_ADMIN')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    accountType === 'ORG_ADMIN'
                      ? 'border-[#2B1B3D] dark:border-[#FFC8DD] bg-[#FFC8DD]/20 dark:bg-[#382550]'
                      : 'border-gray-200 dark:border-[#332352] bg-white dark:bg-[#120B1D]'
                  }`}
                >
                  <Shield className="w-5 h-5 text-[#2B1B3D] dark:text-[#FFC8DD] mb-1" />
                  <div className="text-xs font-black text-[#2B1B3D] dark:text-white">Org Admin</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Assign Tasks to Members</div>
                </button>
              </div>

              {accountType === 'INDIVIDUAL' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Organization Join Code (Optional, 8 characters)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., A1B2C3D4"
                    minLength={8}
                    maxLength={8}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-[#332352] dark:bg-[#120B1D] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD]"
                  />
                </div>
              )}

              {accountType === 'ORG_ADMIN' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Organization Name (Optional — you can create it later)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Student Council 2026"
                    value={orgName}
                    maxLength={150}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-[#332352] dark:bg-[#120B1D] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD]"
                  />
                </div>
              )}
            </div>
          )}

          {captchaSiteKey && (
            <div className="flex justify-center overflow-hidden rounded-xl">
              <HCaptcha
                ref={captchaRef}
                sitekey={captchaSiteKey}
                theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken('')}
                onError={() => setCaptchaToken('')}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-black text-xs rounded-2xl shadow transition transform active:scale-95 mt-2"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In to EduFlow'
                : mode === 'register'
                  ? 'Create Account'
                  : 'Send Reset Link'}
          </button>

          {mode === 'login' && (
            <>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span className="h-px flex-1 bg-gray-200 dark:bg-[#332352]" />
                or
                <span className="h-px flex-1 bg-gray-200 dark:bg-[#332352]" />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handlePasskeySignIn}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2B1B3D] dark:border-[#FFC8DD] py-3 text-xs font-black text-[#2B1B3D] dark:text-[#FFC8DD] transition hover:bg-[#2B1B3D]/5 disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                Sign in with a passkey
              </button>
            </>
          )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
