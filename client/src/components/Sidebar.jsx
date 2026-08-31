import React from 'react';
import { LayoutDashboard, CheckSquare, GraduationCap, Compass, Users, Calendar, AlertCircle, User, Settings } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { stats } = useTasks();

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

  return (
    <aside className="w-64 bg-white dark:bg-[#1E142D] border-r border-gray-200 dark:border-[#332352] min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 transition-colors duration-300">
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
                      onClick={() => setActiveTab(child.id)}
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
                onClick={() => setActiveTab(item.id)}
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

      <div className="mt-8 p-4 bg-gradient-to-br from-[#CDB4DB]/40 via-[#FFC8DD]/40 to-[#BDE0FE]/40 dark:from-[#1E142D] dark:to-[#332352] rounded-2xl border border-[#CDB4DB]/50 dark:border-[#332352] text-center">
        <h4 className="text-xs font-black text-[#2B1B3D] dark:text-[#FFC8DD]">EduFlow PWA v1.2</h4>
        <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-1 font-medium">Offline App & Dark Mode Ready</p>
      </div>
    </aside>
  );
}
