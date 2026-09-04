import React, { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PasswordRecoveryModal() {
  const { completePasswordRecovery, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await completePasswordRecovery(password);
    } catch (err) {
      setError(err.message || 'Unable to update your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-white to-[#EEF8FF] dark:from-[#120B1D] dark:via-[#1E142D] dark:to-[#17243A] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-3xl border border-gray-200 bg-white p-7 shadow-2xl dark:border-[#332352] dark:bg-[#1E142D]">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFC8DD]/50 text-[#2B1B3D] dark:bg-[#382550] dark:text-[#FFC8DD]">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-[#2B1B3D] dark:text-white">Choose a new password</h1>
          <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-300">Use at least eight characters. All existing sessions will be signed out.</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}

        <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-[#FFC8DD] dark:border-[#332352] dark:bg-[#120B1D] dark:text-white" />
        <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirm new password" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-[#FFC8DD] dark:border-[#332352] dark:bg-[#120B1D] dark:text-white" />

        <button disabled={loading} className="w-full rounded-2xl bg-[#FFC8DD] py-3 text-xs font-black text-[#2B1B3D] shadow transition hover:bg-[#FFAFCC] disabled:opacity-50">
          {loading ? 'Updating...' : 'Update password'}
        </button>
        <button type="button" onClick={logout} className="w-full text-xs font-bold text-gray-500 hover:text-[#2B1B3D] dark:hover:text-white">Cancel</button>
      </form>
    </div>
  );
}
