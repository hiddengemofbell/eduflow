import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { User, Layers } from 'lucide-react';
import SecuritySettings from './SecuritySettings';

export default function ProfileView() {
  const { user } = useAuth();
  const { stats } = useTasks();

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="bg-white dark:bg-edu-darkCard p-5 sm:p-8 rounded-3xl border border-gray-200 dark:border-edu-darkBorder shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-edu-card dark:bg-edu-darkBorder text-edu-dark dark:text-white font-black text-2xl sm:text-3xl flex items-center justify-center border-2 border-white dark:border-edu-darkBorder shadow-lg shrink-0">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-edu-dark dark:text-white truncate">{user?.name}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{user?.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-edu-dark dark:bg-edu-accent text-white dark:text-edu-dark">
              {user?.account_type === 'ORG_ADMIN' ? 'Organization Admin' : user?.account_type === 'ORG_MEMBER' ? 'Organization Member' : 'Individual Student'}
            </span>
            {user?.organization && (
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-edu-sec dark:bg-edu-darkBorder text-edu-dark dark:text-edu-sky">
                {user.organization.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Account Details & System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-edu-darkCard p-6 rounded-3xl border border-gray-200 dark:border-edu-darkBorder shadow-sm space-y-4">
          <h3 className="text-base font-bold text-edu-dark dark:text-white flex items-center space-x-2">
            <User className="w-5 h-5 text-edu-dark dark:text-edu-accent" />
            <span>Personal Information</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-edu-darkBg rounded-xl">
              <span className="block font-bold text-gray-400 uppercase text-[10px]">Full Name</span>
              <span className="font-extrabold text-edu-dark dark:text-white">{user?.name}</span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-edu-darkBg rounded-xl">
              <span className="block font-bold text-gray-400 uppercase text-[10px]">Email Address</span>
              <span className="font-extrabold text-edu-dark dark:text-white">{user?.email}</span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-edu-darkBg rounded-xl">
              <span className="block font-bold text-gray-400 uppercase text-[10px]">Account Created</span>
              <span className="font-extrabold text-edu-dark dark:text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Session'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-edu-darkCard p-6 rounded-3xl border border-gray-200 dark:border-edu-darkBorder shadow-sm space-y-4">
          <h3 className="text-base font-bold text-edu-dark dark:text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-edu-dark dark:text-edu-accent" />
            <span>Productivity Summary</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 bg-edu-card/30 dark:bg-edu-darkBorder rounded-2xl border border-edu-card/50 dark:border-edu-darkBorder">
              <div className="text-2xl font-black text-edu-dark dark:text-white">{stats.total}</div>
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mt-0.5">Total Managed</div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.completed}</div>
              <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase mt-0.5">Completed</div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900">
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.pending}</div>
              <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase mt-0.5">Pending</div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900">
              <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.inProgress}</div>
              <div className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase mt-0.5">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      <SecuritySettings />
    </div>
  );
}
