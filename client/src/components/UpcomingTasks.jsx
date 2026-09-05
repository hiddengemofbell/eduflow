import React, { useState } from 'react';
import { useTasks, formatDueDateTime } from '../context/TaskContext';
import { parseLocalDate, toLocalDateString } from '../utils/dates';
import { AlertCircle, Clock, Calendar, CheckCircle2, ArrowUpDown } from 'lucide-react';

export default function UpcomingTasks({ onEditTask }) {
  const { tasks, updateTask } = useTasks();
  const [sortBy, setSortBy] = useState('date');

  const todayStr = toLocalDateString();
  const now = new Date();

  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'COMPLETED' || t.is_archived) return false;
    const due = parseLocalDate(t.due_date);
    return due < now && !t.due_date.startsWith(todayStr);
  });

  const dueTodayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(todayStr) && t.status !== 'COMPLETED' && !t.is_archived);

  const upcomingTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'COMPLETED' || t.is_archived) return false;
    const due = parseLocalDate(t.due_date);
    return due > now && !t.due_date.startsWith(todayStr);
  });

  const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  const sortList = (list) => {
    return [...list].sort((a, b) => {
      if (sortBy === 'priority') {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      const dateA = parseLocalDate(a.due_date);
      const dateB = parseLocalDate(b.due_date);
      if (dateA - dateB !== 0) return dateA - dateB;
      if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
      return 0;
    });
  };

  const renderTaskCard = (t, isOverdue = false) => (
    <div
      key={t.id}
      className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:-translate-y-0.5 ${
        isOverdue
          ? 'bg-red-50/60 dark:bg-red-950/40 border-red-200 dark:border-red-900'
          : 'bg-white dark:bg-[#1E142D] border-gray-200 dark:border-[#332352] hover:border-[#CDB4DB]'
      }`}
    >
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            updateTask(t.id, { status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' })
              .catch((error) => window.alert(error.message));
          }}
          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
            t.status === 'COMPLETED'
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-[#2B1B3D] bg-white dark:bg-[#120B1D]'
          }`}
        >
          {t.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
        </button>

        <div className="min-w-0">
          <h4 className="text-xs font-bold text-[#2B1B3D] dark:text-white truncate">{t.title}</h4>
          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            <span className={`px-2 py-0.5 rounded font-extrabold shrink-0 ${
              t.task_type === 'CURRICULAR' ? 'bg-[#CDB4DB]/40 text-purple-900 dark:text-purple-300' :
              t.task_type === 'EXTRACURRICULAR' ? 'bg-[#BDE0FE]/50 text-blue-900 dark:text-blue-300' :
              'bg-[#FFC8DD]/50 text-pink-900 dark:text-pink-300'
            }`}>
              {t.task_type}
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>{formatDueDateTime(t.due_date, t.due_time)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0">
        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
          t.priority === 'HIGH' ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300' :
          t.priority === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' :
          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
        }`}>
          {t.priority}
        </span>
        <button
          onClick={() => onEditTask(t)}
          className="text-xs font-bold text-[#2B1B3D] dark:text-[#BDE0FE] hover:underline"
        >
          Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1E142D] p-4 sm:p-6 rounded-3xl border border-gray-200 dark:border-[#332352] shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2B1B3D] dark:text-white tracking-tight">
            Upcoming Tasks & Deadlines
          </h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
            Dynamic timeline sorting tasks due today, upcoming, and overdue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-gray-100 dark:bg-[#120B1D] p-1.5 rounded-2xl self-start md:self-auto">
          <ArrowUpDown className="w-4 h-4 text-gray-400 ml-2" />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Sort by:</span>
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-1 font-bold text-xs rounded-xl transition ${
              sortBy === 'date' ? 'bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D] shadow' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Due Date & Time
          </button>
          <button
            onClick={() => setSortBy('priority')}
            className={`px-3 py-1 font-bold text-xs rounded-xl transition ${
              sortBy === 'priority' ? 'bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D] shadow' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            Priority
          </button>
        </div>
      </div>

      {/* Overdue Section */}
      {overdueTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-base font-black uppercase tracking-wide">Overdue Tasks ({overdueTasks.length})</h2>
          </div>
          <div className="space-y-2">
            {sortList(overdueTasks).map(t => renderTaskCard(t, true))}
          </div>
        </div>
      )}

      {/* Due Today Section */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
          <Clock className="w-5 h-5" />
          <h2 className="text-base font-black uppercase tracking-wide">Due Today ({dueTodayTasks.length})</h2>
        </div>
        {dueTodayTasks.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-[#1E142D] rounded-2xl border border-dashed border-gray-200 dark:border-[#332352] text-xs text-gray-400 font-bold">
            No tasks due today! 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {sortList(dueTodayTasks).map(t => renderTaskCard(t))}
          </div>
        )}
      </div>

      {/* Upcoming Deadlines Section */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-[#2B1B3D] dark:text-white">
          <Calendar className="w-5 h-5" />
          <h2 className="text-base font-black uppercase tracking-wide">Upcoming Deadlines ({upcomingTasks.length})</h2>
        </div>
        {upcomingTasks.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-[#1E142D] rounded-2xl border border-dashed border-gray-200 dark:border-[#332352] text-xs text-gray-400 font-bold">
            No upcoming tasks scheduled.
          </div>
        ) : (
          <div className="space-y-2">
            {sortList(upcomingTasks).map(t => renderTaskCard(t))}
          </div>
        )}
      </div>
    </div>
  );
}
