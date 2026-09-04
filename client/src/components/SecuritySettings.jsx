import React, { useCallback, useEffect, useState } from 'react';
import { Fingerprint, KeyRound, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SecuritySettings() {
  const {
    listMfaFactors,
    startMfaEnrollment,
    verifyMfaEnrollment,
    unenrollMfa,
    listPasskeys,
    registerPasskey,
    deletePasskey
  } = useAuth();
  const [factor, setFactor] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [passkeys, setPasskeys] = useState([]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const passkeySupported = typeof window !== 'undefined' && 'PublicKeyCredential' in window;

  const refresh = useCallback(async () => {
    const [factors, savedPasskeys] = await Promise.all([listMfaFactors(), listPasskeys()]);
    setFactor(factors.totp[0] || null);
    setPasskeys(savedPasskeys);
  }, [listMfaFactors, listPasskeys]);

  useEffect(() => {
    refresh().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [refresh]);

  const run = async (action, successMessage) => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await action();
      await refresh();
      setMessage(successMessage);
    } catch (err) {
      setError(err.message || 'The security setting could not be updated.');
    } finally {
      setLoading(false);
    }
  };

  const beginMfa = () => run(async () => {
    const data = await startMfaEnrollment();
    setEnrollment(data);
  }, 'Scan the QR code, then verify the six-digit code.');

  const confirmMfa = () => run(async () => {
    await verifyMfaEnrollment(enrollment.id, code);
    setEnrollment(null);
    setCode('');
  }, 'Two-factor authentication is now enabled.');

  const cancelEnrollment = () => run(async () => {
    if (enrollment?.id) await unenrollMfa(enrollment.id);
    setEnrollment(null);
    setCode('');
  }, 'Two-factor setup was cancelled.');

  return (
    <section className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-edu-darkBorder dark:bg-edu-darkCard">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-black text-edu-dark dark:text-white"><ShieldCheck className="h-5 w-5 text-edu-accent" /> Account security</h2>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">Manage your authenticator and passwordless sign-in methods.</p>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</div>}

      <div className="rounded-2xl border border-gray-200 p-4 dark:border-edu-darkBorder">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-edu-dark dark:text-white"><KeyRound className="h-4 w-4" /> Authenticator app (2FA)</h3>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{factor ? 'Enabled — required after password sign-in.' : 'Add a six-digit code as a second sign-in step.'}</p>
          </div>
          {!factor && !enrollment && <button disabled={loading} onClick={beginMfa} className="rounded-xl bg-edu-dark px-4 py-2 text-[11px] font-black text-white dark:bg-edu-accent dark:text-edu-dark">Enable</button>}
          {factor && <button disabled={loading} onClick={() => run(() => unenrollMfa(factor.id), 'Two-factor authentication was disabled.')} className="rounded-xl border border-red-200 px-4 py-2 text-[11px] font-black text-red-600">Disable</button>}
        </div>

        {enrollment && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-edu-darkBorder">
            <img src={enrollment.totp.qr_code} alt="Authenticator app QR code" className="mx-auto h-44 w-44 rounded-xl bg-white p-2" />
            <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-edu-darkBg">
              <span className="block text-[10px] font-bold uppercase text-gray-400">Manual setup key</span>
              <code className="break-all text-[11px] font-bold text-edu-dark dark:text-white">{enrollment.totp.secret}</code>
            </div>
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-black tracking-[0.25em] outline-none focus:ring-2 focus:ring-edu-accent dark:border-edu-darkBorder dark:bg-edu-darkBg" />
            <div className="flex gap-2">
              <button disabled={loading || code.length !== 6} onClick={confirmMfa} className="flex-1 rounded-xl bg-edu-accent py-2.5 text-[11px] font-black text-edu-dark disabled:opacity-50">Verify and enable</button>
              <button disabled={loading} onClick={cancelEnrollment} className="rounded-xl border border-gray-200 px-4 py-2.5 text-[11px] font-bold dark:border-edu-darkBorder">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 dark:border-edu-darkBorder">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-edu-dark dark:text-white"><Fingerprint className="h-4 w-4" /> Passkeys</h3>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Use biometrics, a device PIN, or a security key without entering a password.</p>
          </div>
          <button disabled={loading || !passkeySupported} onClick={() => run(registerPasskey, 'Passkey registered successfully.')} className="rounded-xl bg-edu-dark px-4 py-2 text-[11px] font-black text-white disabled:opacity-50 dark:bg-edu-accent dark:text-edu-dark">Add passkey</button>
        </div>
        {!passkeySupported && <p className="mt-3 text-[11px] font-semibold text-amber-700">This browser or device does not support passkeys.</p>}
        {passkeys.length > 0 && (
          <div className="mt-4 space-y-2">
            {passkeys.map((passkey) => (
              <div key={passkey.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-edu-darkBg">
                <div>
                  <div className="text-xs font-bold text-edu-dark dark:text-white">{passkey.friendly_name || 'Passkey'}</div>
                  <div className="text-[10px] text-gray-400">Added {new Date(passkey.created_at).toLocaleDateString()}</div>
                </div>
                <button disabled={loading} aria-label="Remove passkey" onClick={() => run(() => deletePasskey(passkey.id), 'Passkey removed.')} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
