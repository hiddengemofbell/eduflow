import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePwa } from '../context/PwaContext';
import { Sun, Moon, Plus, LogOut, Download, Menu } from 'lucide-react';

export default function Navbar({ onOpenTaskModal, onToggleMobileMenu }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { canInstall, triggerDownload } = usePwa();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#1E142D]/90 backdrop-blur-md border-b border-gray-200 dark:border-[#332352] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Drawer Hamburger Button */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-1 text-[#2B1B3D] dark:text-[#FFAFCC] hover:bg-gray-100 dark:hover:bg-[#332352] rounded-xl transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group"
            onClick={() => window.location.reload()}
          >
            <img
              src="/logo.png"
              alt="EduFlow Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow"
            />
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-[#2B1B3D] dark:text-white">
                EduFlow
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FFC8DD] text-[#2B1B3D] dark:bg-[#382550] dark:text-[#FFC8DD] uppercase tracking-wider">
                {user?.account_type === 'ORG_ADMIN' ? 'ORG ADMIN' : 'STUDENT'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Download Shortcut Button (Visible in browser, disappears once fully downloaded/installed) */}
          {canInstall && (
            <button
              type="button"
              onClick={triggerDownload}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] text-xs font-extrabold rounded-xl shadow-sm transition transform hover:scale-105 active:scale-95 border border-[#FFAFCC] shrink-0"
              title="Download EduFlow Shortcut / App"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Download App</span>
              <span className="sm:hidden text-[11px]">Download</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#2B1B3D] dark:text-[#FFAFCC] hover:bg-gray-100 dark:hover:bg-[#332352] transition flex items-center space-x-2"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            aria-pressed={isDark}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-[#FFAFCC]" />
                <span className="text-xs font-bold hidden md:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#2B1B3D]" />
                <span className="text-xs font-bold hidden md:inline">Dark Mode</span>
              </>
            )}
          </button>

          {/* Quick New Task Button */}
          <button
            type="button"
            onClick={() => onOpenTaskModal && onOpenTaskModal('CURRICULAR')}
            className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-extrabold text-xs rounded-xl shadow transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* User Info & Logout */}
          {user && (
            <div className="flex items-center space-x-1.5 sm:space-x-2 border-l border-gray-200 dark:border-[#332352] pl-2 sm:pl-3">
              <div className="w-8 h-8 rounded-full bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D] flex items-center justify-center font-bold text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-extrabold text-[#2B1B3D] dark:text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[120px]">{user.email}</div>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
