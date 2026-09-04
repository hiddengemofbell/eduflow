import React from 'react';
import { ArrowRight, PartyPopper, X } from 'lucide-react';

export default function WelcomeBanner({ name, onDismiss, onGetStarted }) {
  const firstName = name?.trim().split(/\s+/)[0] || 'there';

  return (
    <section
      aria-label="Welcome to EduFlow"
      className="relative mb-6 overflow-hidden rounded-3xl border border-[#CDB4DB]/60 bg-gradient-to-r from-[#CDB4DB]/45 via-[#FFC8DD]/45 to-[#BDE0FE]/55 p-5 shadow-sm dark:border-[#4B3566] dark:from-[#302044] dark:via-[#382550] dark:to-[#203754] md:p-6"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/30 blur-2xl dark:bg-[#FFC8DD]/10" />
      <button
        type="button"
        aria-label="Dismiss welcome message"
        onClick={onDismiss}
        className="absolute right-4 top-4 rounded-full p-1.5 text-[#2B1B3D]/70 transition hover:bg-white/60 hover:text-[#2B1B3D] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative flex flex-col items-start gap-4 pr-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[#6D4C7D] shadow-sm dark:bg-[#120B1D]/70 dark:text-[#FFC8DD]">
            <PartyPopper className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6D4C7D] dark:text-[#FFC8DD]">You&apos;re all set</p>
            <h2 className="mt-1 text-xl font-black text-[#2B1B3D] dark:text-white">Welcome to EduFlow, {firstName}!</h2>
            <p className="mt-1 max-w-xl text-xs font-semibold leading-5 text-[#4E3A5C]/80 dark:text-gray-300">
              Your workspace is ready. Add your first task and start turning a busy schedule into a clear plan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGetStarted}
          className="ml-16 flex shrink-0 items-center gap-2 rounded-2xl bg-[#2B1B3D] px-4 py-2.5 text-xs font-black text-white shadow transition hover:-translate-y-0.5 hover:shadow-md dark:bg-[#FFC8DD] dark:text-[#2B1B3D] sm:ml-0"
        >
          Create my first task
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
