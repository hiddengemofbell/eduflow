import React from 'react';
import { CheckCircle2, Shield, Users, Layers, ArrowRight, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { usePwa } from '../context/PwaContext';

export default function LandingPage({ onOpenLogin, onOpenRegister }) {
  const { isDark, toggleTheme } = useTheme();
  const { canInstall, triggerDownload } = usePwa();

  return (
    <div className="min-h-screen bg-white dark:bg-[#120B1D] text-[#2B1B3D] dark:text-gray-100 font-sans flex flex-col transition-colors duration-300">
      {/* Header / Navbar */}
      <header className="border-b border-gray-100 dark:border-[#332352] bg-white/80 dark:bg-[#1E142D]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img src="/logo.png" alt="EduFlow Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow" />
            <span className="font-black text-xl sm:text-2xl tracking-tight text-[#2B1B3D] dark:text-white">EduFlow</span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {canInstall && (
              <button
                type="button"
                onClick={triggerDownload}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] text-xs font-black rounded-xl shadow-sm transition transform hover:scale-105 active:scale-95 border border-[#FFAFCC]"
                title="Download EduFlow Shortcut / App"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download App</span>
                <span className="sm:hidden text-[11px]">Download</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#332352] text-xs font-bold text-[#2B1B3D] dark:text-[#FFAFCC] hover:bg-gray-50 dark:hover:bg-[#332352] transition"
              aria-label="Toggle theme"
            >
              <span className="hidden sm:inline">{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
              <span className="sm:hidden">{isDark ? '☀️' : '🌙'}</span>
            </button>

            <button
              onClick={onOpenLogin}
              className="px-2.5 sm:px-4 py-2 text-xs font-bold text-[#2B1B3D] dark:text-white hover:bg-gray-100 dark:hover:bg-[#332352] rounded-xl transition"
            >
              Log In
            </button>

            <button
              onClick={onOpenRegister}
              className="px-3.5 sm:px-5 py-2 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-extrabold text-xs rounded-xl shadow transition transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#CDB4DB]/30 dark:bg-[#332352] border border-[#CDB4DB] dark:border-[#3E285C] text-xs font-extrabold text-[#2B1B3D] dark:text-[#FFC8DD]">
            <img src="/logo.png" alt="EduFlow Logo" className="w-4 h-4 object-contain" />
            <span>EduFlow Student Task & Activity Management Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-[#2B1B3D] dark:text-white tracking-tight leading-tight">
            Organize Your Studies & Organization Duties <span className="text-[#FFC8DD] dark:text-[#FFAFCC]">In One Central Flow.</span>
          </h1>

          <p className="text-base text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Manage academic requirements, extracurricular activities, and student organization responsibilities with ease. Designed for students who want complete workload clarity.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-black text-sm rounded-2xl shadow-lg transition transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-8 py-3.5 bg-gray-100 dark:bg-[#1E142D] text-[#2B1B3D] dark:text-white border border-gray-200 dark:border-[#332352] font-extrabold text-sm rounded-2xl hover:bg-gray-200 dark:hover:bg-[#332352] transition"
            >
              Log In to Portal
            </button>

            {canInstall && (
              <button
                type="button"
                onClick={triggerDownload}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#BDE0FE]/35 hover:bg-[#BDE0FE] dark:bg-[#332352] dark:hover:bg-[#3E285C] text-[#2B1B3D] dark:text-[#BDE0FE] border border-[#BDE0FE] dark:border-[#3E285C] font-extrabold text-sm rounded-2xl transition flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Shortcut</span>
              </button>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="p-6 bg-white dark:bg-[#1E142D] border border-gray-200 dark:border-[#332352] rounded-3xl shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#CDB4DB]/40 dark:bg-[#332352] flex items-center justify-center text-[#2B1B3D] dark:text-[#FFAFCC] font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2B1B3D] dark:text-white">Curricular Tasks</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Track quizzes, assignments, midterm exams, and projects with priority tagging.</p>
          </div>

          <div className="p-6 bg-white dark:bg-[#1E142D] border border-gray-200 dark:border-[#332352] rounded-3xl shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#BDE0FE]/50 dark:bg-blue-950/50 flex items-center justify-center text-blue-800 dark:text-blue-300 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2B1B3D] dark:text-white">Extracurricular</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Organize personal projects, event preparations, and club meetings in one place.</p>
          </div>

          <div className="p-6 bg-white dark:bg-[#1E142D] border border-gray-200 dark:border-[#332352] rounded-3xl shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#FFC8DD]/50 dark:bg-pink-950/50 flex items-center justify-center text-pink-800 dark:text-pink-300 font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2B1B3D] dark:text-white">Org Assignments</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Organization admins can assign tasks directly to student officers and members.</p>
          </div>

          <div className="p-6 bg-white dark:bg-[#1E142D] border border-gray-200 dark:border-[#332352] rounded-3xl shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2B1B3D] dark:text-white">Offline PWA App</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Install as a native application on desktop and mobile with complete offline access.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
