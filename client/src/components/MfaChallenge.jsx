import React, { useState } from 'react';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MfaChallenge() {
  const { verifyMfa, logout } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMfa(code);
    } catch (err) {
      setError(err.message || 'The verification code could not be confirmed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-white to-[#EEF8FF] dark:from-[#120B1D] dark:via-[#1E142D] dark:to-[#17243A] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-3xl border border-gray-200 bg-white p-7 shadow-2xl dark:border-[#332352] dark:bg-[#1E142D]">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFC8DD]/50 text-[#2B1B3D] dark:bg-[#382550] dark:text-[#FFC8DD]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-[#2B1B3D] dark:text-white">Two-factor verification</h1>
          <p className="mt-2 text-xs font-medium leading-5 text-gray-500 dark:text-gray-300">
            Enter the six-digit code from your authenticator app to finish signing in.
          </p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}

        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">Authenticator code</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              autoFocus
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-center text-lg font-black tracking-[0.35em] outline-none focus:ring-2 focus:ring-[#FFC8DD] dark:border-[#332352] dark:bg-[#120B1D] dark:text-white"
            />
          </div>
        </div>

        <button disabled={loading || code.length !== 6} className="w-full rounded-2xl bg-[#FFC8DD] py-3 text-xs font-black text-[#2B1B3D] shadow transition hover:bg-[#FFAFCC] disabled:opacity-50">
          {loading ? 'Verifying...' : 'Verify and continue'}
        </button>
        <button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-[#2B1B3D] dark:hover:text-white">
          <LogOut className="h-4 w-4" />
          Cancel and sign out
        </button>
      </form>
    </div>
  );
}
