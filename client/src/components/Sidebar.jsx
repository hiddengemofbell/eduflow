import React from 'react';
import { LayoutDashboard, CheckSquare, GraduationCap, Compass, Users, Calendar, AlertCircle, User, Settings, Archive, X, Download } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { usePwa } from '../context/PwaContext';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, onCloseMobileMenu }) {
  const { stats } = useTasks();
  const { canInstall, triggerDownload } = usePwa();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'tasks-group',
      label: 'TASKS',
      isGroup: true,
      children: [
        { id: 'tasks-all', label: 'All Tasks', icon: CheckSquare, count: stats.total },
        { id: 'tasks-curricular', label: 'Curricular', icon: GraduationCap, count: stats.curricular },
        { id: 'tasks-extracurricular', label: 'Extracurricular', icon: Compass, count: stats.extracurricular },
        { id: 'tasks-org', label: 'Organization Tasks', icon: Users, count: stats.org },
        { id: 'tasks-archived', label: 'Archived Tasks', icon: Archive, count: stats.archived },
      ]
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'upcoming', label: 'Upcoming & Reminders', icon: AlertCircle, badge: stats.dueToday + stats.overdue },
    {
      id: 'account-group',
      label: 'ACCOUNT',
      isGroup: true,
      children: [
        { id: 'account-profile', label: 'Profile', icon: User },
        { id: 'account-org', label: 'Organization', icon: Settings }
      ]
    }
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  const renderNavContent = () => (
    <>
      <nav className="space-y-6">
        {navItems.map((item) => {
          if (item.isGroup) {
            return (
              <div key={item.id} className="space-y-1">
                <div className="px-3 text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-400 mb-2">
                  {item.label}
                </div>
                {item.children.map((child) => {
                  const Icon = child.icon;
                  const isActive = activeTab === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleSelectTab(child.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-extrabold text-xs transition transform hover:translate-x-1 ${
                        isActive
                          ? 'bg-[#FFC8DD] text-[#2B1B3D] shadow-md'
                          : 'text-[#2B1B3D] dark:text-gray-200 hover:bg-[#BDE0FE]/40 dark:hover:bg-[#332352]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#2B1B3D]' : 'text-gray-400 dark:text-gray-400'}`} />
                        <span>{child.label}</span>
                      </div>
                      {child.count !== undefined && child.count > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-[#2B1B3D]/10 text-[#2B1B3D]' : 'bg-[#BDE0FE] dark:bg-[#332352] text-[#2B1B3D] dark:text-[#BDE0FE]'
                        }`}>
                          {child.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div key={item.id}>
              <button
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-extrabold text-xs transition transform hover:translate-x-1 ${
                  isActive
                    ? 'bg-[#FFC8DD] text-[#2B1B3D] shadow-md'
                    : 'text-[#2B1B3D] dark:text-gray-200 hover:bg-[#BDE0FE]/40 dark:hover:bg-[#332352]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2B1B3D]' : 'text-gray-400 dark:text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {canInstall ? (
        <div className="mt-6 p-4 bg-gradient-to-br from-[#FFC8DD]/40 via-[#BDE0FE]/40 to-[#CDB4DB]/40 dark:from-[#2B1B3D] dark:to-[#332352] rounded-2xl border border-[#FFAFCC]/60 dark:border-[#3E285C] text-center space-y-2 shadow-sm">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-black text-[#2B1B3D] dark:text-white">
            <Download className="w-4 h-4 text-[#2B1B3D] dark:text-[#FFAFCC]" />
            <span>Download Shortcut</span>
          </div>
          <p className="text-[10px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
            Install app shortcut for 1-click access and offline usage.
          </p>
          <button
            type="button"
            onClick={() => {
              if (onCloseMobileMenu) onCloseMobileMenu();
              triggerDownload();
            }}
            className="w-full py-2 px-3 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] text-xs font-black rounded-xl shadow transition transform hover:scale-[1.02] active:scale-95"
          >
            Download App
          </button>
        </div>
      ) : (
        <div className="mt-8 p-4 bg-gradient-to-br from-[#CDB4DB]/40 via-[#FFC8DD]/40 to-[#BDE0FE]/40 dark:from-[#1E142D] dark:to-[#332352] rounded-2xl border border-[#CDB4DB]/50 dark:border-[#332352] text-center">
          <h4 className="text-xs font-black text-[#2B1B3D] dark:text-[#FFC8DD]">EduFlow v1.2</h4>
          <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-1 font-medium">Offline App & Dark Mode Ready</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-[#1E142D] border-r border-gray-200 dark:border-[#332352] min-h-[calc(100vh-4rem)] p-4 flex-col justify-between shrink-0 transition-colors duration-300">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer (Slide-over) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#2B1B3D]/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobileMenu}
          />

          {/* Drawer Sheet */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#1E142D] border-r border-gray-200 dark:border-[#332352] p-4 flex flex-col justify-between shadow-2xl overflow-y-auto transform transition duration-300 z-10 animate-slide-right">
            <div>
              {/* Mobile Drawer Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-[#332352]">
                <div className="flex items-center space-x-2.5">
                  <img src="/logo.png" alt="EduFlow Logo" className="w-8 h-8 object-contain drop-shadow" />
                  <span className="font-black text-xl tracking-tight text-[#2B1B3D] dark:text-white">EduFlow</span>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobileMenu}
                  className="p-1.5 text-gray-500 hover:text-[#2B1B3D] dark:text-gray-400 dark:hover:text-white rounded-xl transition"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderNavContent()}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
