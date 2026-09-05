import React, { useState } from 'react';
import { useTasks, formatDueDateTime } from '../context/TaskContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, X, Clock } from 'lucide-react';

export default function CalendarView({ onEditTask }) {
  const { tasks } = useTasks();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedTask, setSelectedTask] = useState(null);

  const [showCurricular, setShowCurricular] = useState(true);
  const [showExtracurricular, setShowExtracurricular] = useState(true);
  const [showOrg, setShowOrg] = useState(true);

  const prevPeriod = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else {
      next.setDate(next.getDate() - 7);
    }
    setCurrentDate(next);
  };

  const nextPeriod = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setCurrentDate(next);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const visibleTasks = tasks.filter(t => {
    if (t.is_archived) return false;
    if (t.task_type === 'CURRICULAR' && !showCurricular) return false;
    if (t.task_type === 'EXTRACURRICULAR' && !showExtracurricular) return false;
    if (t.task_type === 'ORG' && !showOrg) return false;
    return true;
  });

  const getTasksForDate = (dayNum) => {
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return visibleTasks.filter(t => {
      if (!t.due_date) return false;
      return t.due_date.startsWith(targetDateStr);
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Calendar Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1E142D] p-6 rounded-3xl border border-gray-200 dark:border-[#332352] shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D] flex items-center justify-center shadow font-bold">
            <CalendarIcon className="w-5 h-5 text-[#FFC8DD] dark:text-[#2B1B3D]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#2B1B3D] dark:text-white tracking-tight">
              {monthNames[month]} {year}
            </h1>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Interactive Schedule & Task Deadline Map
            </p>
          </div>
        </div>

        {/* View Switcher & Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 dark:bg-[#120B1D] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 font-bold text-xs rounded-lg transition ${
                viewMode === 'month' ? 'bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D] shadow' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 font-bold text-xs rounded-lg transition ${
                viewMode === 'week' ? 'bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D] shadow' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Week View
            </button>
          </div>

          <div className="flex items-center space-x-1 border-l border-gray-200 dark:border-[#332352] pl-3">
            <button
              onClick={prevPeriod}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#332352] rounded-xl transition text-[#2B1B3D] dark:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-bold bg-[#BDE0FE]/40 dark:bg-[#332352] text-[#2B1B3D] dark:text-white hover:bg-[#BDE0FE] rounded-xl transition"
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#332352] rounded-xl transition text-[#2B1B3D] dark:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Checkboxes */}
      <div className="bg-white dark:bg-[#1E142D] p-4 rounded-2xl border border-gray-200 dark:border-[#332352] shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          <span>Category Filter:</span>
        </div>

        <label className="flex items-center space-x-2 text-xs font-bold text-[#2B1B3D] dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={showCurricular}
            onChange={(e) => setShowCurricular(e.target.checked)}
            className="w-4 h-4 rounded text-[#CDB4DB] focus:ring-[#FFC8DD]"
          />
          <span className="px-2 py-0.5 rounded bg-[#CDB4DB]/40 dark:bg-purple-950/60 border border-[#CDB4DB] dark:border-purple-800 text-purple-900 dark:text-purple-300">Curricular</span>
        </label>

        <label className="flex items-center space-x-2 text-xs font-bold text-[#2B1B3D] dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={showExtracurricular}
            onChange={(e) => setShowExtracurricular(e.target.checked)}
            className="w-4 h-4 rounded text-[#A2D2FF] focus:ring-[#BDE0FE]"
          />
          <span className="px-2 py-0.5 rounded bg-[#BDE0FE]/50 dark:bg-blue-950/60 border border-[#A2D2FF] dark:border-blue-800 text-blue-900 dark:text-blue-300">Extracurricular</span>
        </label>

        <label className="flex items-center space-x-2 text-xs font-bold text-[#2B1B3D] dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={showOrg}
            onChange={(e) => setShowOrg(e.target.checked)}
            className="w-4 h-4 rounded text-[#FFC8DD] focus:ring-[#FFAFCC]"
          />
          <span className="px-2 py-0.5 rounded bg-[#FFC8DD]/50 dark:bg-pink-950/60 border border-[#FFAFCC] dark:border-pink-800 text-pink-900 dark:text-pink-300">Organization</span>
        </label>
      </div>

      {/* Grid View */}
      <div className="bg-white dark:bg-[#1E142D] rounded-3xl border border-gray-200 dark:border-[#332352] shadow-sm overflow-hidden p-4">
        <div className="grid grid-cols-7 gap-2 text-center pb-3 border-b border-gray-100 dark:border-[#332352] font-extrabold text-xs text-gray-400 dark:text-gray-400 uppercase tracking-wider">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] bg-gray-50/40 dark:bg-[#120B1D]/30 rounded-2xl p-2" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayTasks = getTasksForDate(dayNum);
            const isToday =
              dayNum === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={dayNum}
                className={`min-h-[100px] rounded-2xl p-2 border transition flex flex-col justify-between ${
                  isToday
                    ? 'bg-[#BDE0FE]/20 dark:bg-[#332352] border-[#2B1B3D] dark:border-[#FFC8DD] ring-2 ring-[#2B1B3D] dark:ring-[#FFC8DD]'
                    : 'bg-white dark:bg-[#120B1D] border-gray-100 dark:border-[#332352] hover:border-[#CDB4DB]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D]' : 'text-[#2B1B3D] dark:text-gray-300'
                  }`}>
                    {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[9px] font-bold text-gray-400">
                      {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px]">
                  {dayTasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className={`w-full text-left p-1 rounded-lg text-[10px] font-bold truncate transition transform hover:scale-102 block ${
                        t.task_type === 'CURRICULAR' ? 'bg-[#CDB4DB] dark:bg-purple-900 text-purple-950 dark:text-purple-100' :
                        t.task_type === 'EXTRACURRICULAR' ? 'bg-[#A2D2FF] dark:bg-blue-900 text-blue-950 dark:text-blue-100' :
                        'bg-[#FFC8DD] dark:bg-pink-900 text-pink-950 dark:text-pink-100'
                      }`}
                    >
                      {t.due_time ? `${t.due_time} ` : ''}{t.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-edu-dark/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E142D] w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-[#332352] overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-[#CDB4DB]/40 via-[#FFC8DD]/40 to-[#BDE0FE]/40 dark:from-[#2B1B3D] dark:to-[#382550] p-6 relative">
              <button
                onClick={() => setSelectedTask(null)}
                className="absolute top-4 right-4 text-[#2B1B3D] dark:text-gray-300 bg-white/60 dark:bg-[#332352] p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D]">
                {selectedTask.task_type}
              </span>
              <h3 className="text-xl font-black text-[#2B1B3D] dark:text-white mt-2">{selectedTask.title}</h3>
            </div>

            <div className="p-6 space-y-4 text-xs font-medium text-gray-600 dark:text-gray-300">
              {selectedTask.description ? (
                <p className="bg-gray-50 dark:bg-[#120B1D] p-3 rounded-xl border border-gray-100 dark:border-[#332352] text-[#2B1B3D] dark:text-white">
                  {selectedTask.description}
                </p>
              ) : (
                <p className="italic text-gray-400">No additional description provided.</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-[#120B1D] rounded-xl">
                  <span className="block font-bold text-gray-400 uppercase text-[10px]">Due Schedule</span>
                  <span className="font-extrabold text-[#2B1B3D] dark:text-white">
                    {formatDueDateTime(selectedTask.due_date, selectedTask.due_time)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-[#120B1D] rounded-xl">
                  <span className="block font-bold text-gray-400 uppercase text-[10px]">Priority</span>
                  <span className="font-extrabold text-[#2B1B3D] dark:text-white">{selectedTask.priority}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    const taskToEdit = selectedTask;
                    setSelectedTask(null);
                    onEditTask(taskToEdit);
                  }}
                  className="px-4 py-2 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-extrabold rounded-xl shadow text-xs"
                >
                  Edit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
