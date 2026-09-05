import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import { toLocalDateString } from '../utils/dates';
import { Quote, RefreshCw, CheckCircle2, Clock, AlertTriangle, Layers, Plus, Calendar as CalendarIcon, ArrowRight, WifiOff, Sparkles } from 'lucide-react';

const STUDENT_QUOTES = [
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Organizing your time is organizing your freedom.", author: "EduFlow Wisdom" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Small progress is still progress. Keep going!", author: "Student Mantra" }
];

export default function Dashboard({ onOpenTaskModal, setActiveTab }) {
  const { user } = useAuth();
  const { tasks, stats, dueTodayTasks, overdueTasks, addTask, updateTask, isOffline } = useTasks();

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickType, setQuickType] = useState('CURRICULAR');
  const [quickDueDate, setQuickDueDate] = useState(toLocalDateString);
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % STUDENT_QUOTES.length);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setQuickSubmitting(true);
    try {
      await addTask({
        title: quickTitle,
        description: 'Created via Dashboard Quick Add',
        task_type: quickType,
        due_date: quickDueDate,
        priority: 'MEDIUM'
      });
      setQuickTitle('');
    } catch (err) {
      alert(err.message || 'Error adding task');
    } finally {
      setQuickSubmitting(false);
    }
  };

  const currentQuote = STUDENT_QUOTES[quoteIndex];

  const categoryOptions = [
    { value: 'CURRICULAR', label: 'Curricular' },
    { value: 'EXTRACURRICULAR', label: 'Extracurricular' }
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-5 h-5 text-amber-500" />
            <span>Offline Mode Active — Tasks created or updated will save locally and sync when reconnected.</span>
          </div>
        </div>
      )}

      {/* Welcome Banner & Random Quote Generator */}
      <div className="bg-gradient-to-r from-[#CDB4DB]/60 via-[#FFC8DD]/60 to-[#BDE0FE]/60 dark:from-[#2B1B3D] dark:via-[#1E142D] dark:to-[#382550] p-6 sm:p-8 rounded-3xl border border-[#CDB4DB]/50 dark:border-[#3E285C] shadow-sm relative overflow-hidden transition-colors duration-300">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2B1B3D] dark:text-white tracking-tight">
              Hello, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-sm font-bold text-[#2B1B3D]/80 dark:text-[#FFC8DD] mt-1">
              Here is your workload breakdown and upcoming priorities for today.
            </p>
          </div>

          {/* Quote Card */}
          <div className="bg-white/90 dark:bg-[#120B1D] backdrop-blur-md p-4 rounded-2xl border border-white/60 dark:border-[#3E285C] shadow-md max-w-md w-full relative">
            <div className="flex items-start space-x-3">
              <Quote className="w-5 h-5 text-[#2B1B3D] dark:text-[#FFAFCC] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-[#2B1B3D] dark:text-white italic leading-relaxed">
                  "{currentQuote.text}"
                </p>
                <div className="text-[10px] font-extrabold text-gray-600 dark:text-[#FFC8DD] mt-1 text-right">
                  — {currentQuote.author}
                </div>
              </div>
              <button
                onClick={nextQuote}
                title="Generate new quote"
                className="p-1.5 text-[#2B1B3D] dark:text-[#FFAFCC] hover:bg-[#FFC8DD]/40 dark:hover:bg-[#382550] rounded-lg transition transform active:rotate-180"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* In-app Reminders Alert */}
      {(overdueTasks.length > 0 || dueTodayTasks.length > 0) && (
        <div className="space-y-3">
          {overdueTasks.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/40 border-l-4 border-red-500 p-4 rounded-2xl flex items-center justify-between shadow-sm border dark:border-red-900/50">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold text-red-800 dark:text-red-300 uppercase tracking-wide">
                    Overdue Tasks Warning ({overdueTasks.length})
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                    You have tasks past their due date! Address them to stay on track.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('upcoming')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition transform hover:scale-105"
              >
                View Overdue
              </button>
            </div>
          )}

          {dueTodayTasks.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-2xl flex items-center justify-between shadow-sm border dark:border-amber-900/50">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                    Due Today ({dueTodayTasks.length})
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    {dueTodayTasks.map(t => t.title).join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('upcoming')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition transform hover:scale-105"
              >
                View Today
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1E142D] p-5 rounded-2xl border border-gray-200 dark:border-[#332352] shadow-sm flex items-center justify-between transition hover:-translate-y-1">
          <div>
            <div className="text-xs font-extrabold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Total Tasks</div>
            <div className="text-3xl font-black text-[#2B1B3D] dark:text-white mt-1">{stats.total}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#CDB4DB]/40 dark:bg-[#332352] flex items-center justify-center text-[#2B1B3D] dark:text-[#FFAFCC] font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E142D] p-5 rounded-2xl border border-gray-200 dark:border-[#332352] shadow-sm flex items-center justify-between transition hover:-translate-y-1">
          <div>
            <div className="text-xs font-extrabold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Pending</div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E142D] p-5 rounded-2xl border border-gray-200 dark:border-[#332352] shadow-sm flex items-center justify-between transition hover:-translate-y-1">
          <div>
            <div className="text-xs font-extrabold text-gray-400 dark:text-gray-400 uppercase tracking-wider">In Progress</div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.inProgress}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#BDE0FE]/40 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E142D] p-5 rounded-2xl border border-gray-200 dark:border-[#332352] shadow-sm flex items-center justify-between transition hover:-translate-y-1">
          <div>
            <div className="text-xs font-extrabold text-gray-400 dark:text-gray-400 uppercase tracking-wider">Completed</div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Task Add Widget */}
        <div className="bg-white dark:bg-[#1E142D] p-6 rounded-3xl border border-gray-200 dark:border-[#332352] shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D] flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#2B1B3D] dark:text-white">Quick Task Creation</h3>
          </div>

          <form onSubmit={handleQuickAdd} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Task Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Submit Chemistry Lab Report"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-[#332352] dark:bg-[#120B1D] text-[#2B1B3D] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <CustomSelect
                  value={quickType}
                  onChange={setQuickType}
                  options={categoryOptions}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                <CustomDatePicker
                  value={quickDueDate}
                  onChange={setQuickDueDate}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={quickSubmitting}
              className="w-full py-2.5 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-extrabold text-xs rounded-xl shadow transition transform active:scale-95 mt-2"
            >
              {quickSubmitting ? 'Adding...' : 'Add Task to Schedule'}
            </button>
          </form>
        </div>

        {/* Week's Upcoming Tasks List */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E142D] p-6 rounded-3xl border border-gray-200 dark:border-[#332352] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-[#2B1B3D] dark:text-[#FFAFCC]" />
              <h3 className="text-base font-bold text-[#2B1B3D] dark:text-white">This Week's Workload</h3>
            </div>
            <button
              onClick={() => setActiveTab('tasks-all')}
              className="text-xs font-bold text-[#2B1B3D] dark:text-[#BDE0FE] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 dark:bg-[#120B1D] rounded-2xl border border-dashed border-gray-200 dark:border-[#332352] space-y-2">
              <Sparkles className="w-6 h-6 text-[#FFC8DD] dark:text-[#FFAFCC] mx-auto animate-bounce" />
              <p className="text-xs font-bold text-[#2B1B3D] dark:text-white">Looks like there's no task left for this week... Well done! 🎉</p>
              <p className="text-[10px] text-gray-500 dark:text-[#FFC8DD] font-medium">Awww... look at you! All caught up, organized, and stress-free. ✨</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {tasks.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl border border-gray-100 dark:border-[#332352] bg-gray-50/50 dark:bg-[#160F24] hover:bg-white dark:hover:bg-[#1E142D] transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateTask(t.id, { status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' })
                        .catch((error) => window.alert(error.message))}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-[#2B1B3D] bg-white dark:bg-[#120B1D]'
                      }`}
                    >
                      {t.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div>
                      <div className={`text-xs font-bold text-[#2B1B3D] dark:text-white ${t.status === 'COMPLETED' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                        {t.title}
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-0.5 rounded font-extrabold ${
                          t.task_type === 'CURRICULAR' ? 'bg-[#CDB4DB]/40 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300' :
                          t.task_type === 'EXTRACURRICULAR' ? 'bg-[#BDE0FE]/50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300' :
                          'bg-[#FFC8DD]/50 dark:bg-pink-950/80 text-pink-900 dark:text-pink-300'
                        }`}>
                          {t.task_type}
                        </span>
                        <span>Due: {t.due_date ? String(t.due_date).split('T')[0] : ''}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                    t.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
                    t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
