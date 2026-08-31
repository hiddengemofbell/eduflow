import React, { useState } from 'react';
import { useTasks, formatDueDateTime } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import CustomSelect from './CustomSelect';
import { Search, Filter, Plus, Edit2, Trash2, CheckCircle2, Clock, Building, User, Sparkles, RefreshCw } from 'lucide-react';

export default function TaskViews({ activeCategory = 'all', onOpenTaskModal, onEditTask }) {
  const { tasks, loading, updateTask, deleteTask } = useTasks();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredTasks = tasks.filter(t => {
    if (activeCategory === 'curricular' && t.task_type !== 'CURRICULAR') return false;
    if (activeCategory === 'extracurricular' && t.task_type !== 'EXTRACURRICULAR') return false;
    if (activeCategory === 'org' && t.task_type !== 'ORG') return false;

    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = t.title.toLowerCase().includes(q);
      const descMatch = t.description ? t.description.toLowerCase().includes(q) : false;
      return titleMatch || descMatch;
    }

    return true;
  });

  const priorityFilterOptions = [
    { value: 'ALL', label: 'All Priorities' },
    { value: 'HIGH', label: 'High Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'LOW', label: 'Low Priority' }
  ];

  const statusFilterOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  const getCategoryBadge = (type) => {
    switch (type) {
      case 'CURRICULAR':
        return <span className="bg-[#CDB4DB]/40 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border border-[#CDB4DB] dark:border-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Curricular</span>;
      case 'EXTRACURRICULAR':
        return <span className="bg-[#BDE0FE]/50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-[#A2D2FF] dark:border-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Extracurricular</span>;
      case 'ORG':
        return <span className="bg-[#FFC8DD]/50 dark:bg-pink-950/60 text-pink-900 dark:text-pink-300 border border-[#FFAFCC] dark:border-pink-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Organization</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">High Priority</span>;
      case 'MEDIUM':
        return <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Medium</span>;
      case 'LOW':
        return <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Low</span>;
      default:
        return null;
    }
  };

  const getStatusButton = (t) => {
    const isCompleted = t.status === 'COMPLETED';
    const isInProgress = t.status === 'IN_PROGRESS';

    const handleCycleStatus = () => {
      let nextStatus = 'PENDING';
      if (t.status === 'PENDING') nextStatus = 'IN_PROGRESS';
      else if (t.status === 'IN_PROGRESS') nextStatus = 'COMPLETED';
      else nextStatus = 'PENDING';

      updateTask(t.id, { status: nextStatus });
    };

    return (
      <button
        onClick={handleCycleStatus}
        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition transform hover:scale-105 ${
          isCompleted ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' :
          isInProgress ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' :
          'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
        }`}
      >
        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
        <span>{t.status.replace('_', ' ')}</span>
      </button>
    );
  };

  const categoryTitles = {
    all: 'All Tasks & Activities',
    curricular: 'Curricular Tasks (Academic Requirements)',
    extracurricular: 'Extracurricular & Event Responsibilities',
    org: 'Organization-Assigned Responsibilities'
  };

  const isSearchActive = searchQuery.trim() !== '' || priorityFilter !== 'ALL' || statusFilter !== 'ALL';
  const isTotalCategoryEmpty = tasks.filter(t => {
    if (activeCategory === 'curricular') return t.task_type === 'CURRICULAR';
    if (activeCategory === 'extracurricular') return t.task_type === 'EXTRACURRICULAR';
    if (activeCategory === 'org') return t.task_type === 'ORG';
    return true;
  }).length === 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1E142D] p-6 rounded-3xl border border-gray-200 dark:border-[#332352] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#2B1B3D] dark:text-white tracking-tight">
            {categoryTitles[activeCategory] || 'Task Management'}
          </h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
            Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
          </p>
        </div>

        <button
          onClick={onOpenTaskModal}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-extrabold text-xs rounded-2xl shadow transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white dark:bg-[#1E142D] p-4 rounded-2xl border border-gray-200 dark:border-[#332352] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 dark:border-[#332352] dark:bg-[#120B1D] dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority:</span>
          </div>
          <CustomSelect
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={priorityFilterOptions}
            className="w-36"
          />

          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 pl-2 border-l border-gray-200 dark:border-[#332352]">
            <span>Status:</span>
          </div>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusFilterOptions}
            className="w-36"
          />
        </div>
      </div>

      {/* Task List / Empty States */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-gray-400">Loading tasks...</div>
      ) : isTotalCategoryEmpty ? (
        /* Empty State A: No tasks in system/category */
        <div className="p-12 text-center bg-white dark:bg-[#1E142D] rounded-3xl border border-dashed border-gray-200 dark:border-[#332352] space-y-4 animate-scale-in">
          <div className="w-16 h-16 rounded-3xl bg-[#FFC8DD]/30 dark:bg-[#382550] flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8 text-[#2B1B3D] dark:text-[#FFAFCC] animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#2B1B3D] dark:text-white">
              Looks like there's no task... Well done! 🎉
            </h3>
            <p className="text-xs font-bold text-gray-500 dark:text-[#FFC8DD] max-w-md mx-auto leading-relaxed">
              Awww... look at you! All caught up, organized, and stress-free. Time to treat yourself or add a new goal! ✨
            </p>
          </div>
          <button
            onClick={onOpenTaskModal}
            className="px-6 py-2.5 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-extrabold text-xs rounded-2xl shadow transition transform hover:scale-105 active:scale-95"
          >
            + Create New Task
          </button>
        </div>
      ) : filteredTasks.length === 0 && isSearchActive ? (
        /* Empty State B: Search Query / Filter with no results */
        <div className="p-12 text-center bg-white dark:bg-[#1E142D] rounded-3xl border border-dashed border-gray-200 dark:border-[#332352] space-y-4 animate-scale-in">
          <div className="w-16 h-16 rounded-3xl bg-[#BDE0FE]/30 dark:bg-[#332352] flex items-center justify-center mx-auto shadow-inner">
            <Search className="w-8 h-8 text-[#2B1B3D] dark:text-[#BDE0FE] animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#2B1B3D] dark:text-white">
              Awww... no tasks matching {searchQuery ? `"${searchQuery}"` : 'your filters'} 🔍
            </h3>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              We searched high and low, but couldn't find a task matching those criteria! Try adjusting your keyword or reset your filters.
            </p>
          </div>
          <button
            onClick={() => { setSearchQuery(''); setPriorityFilter('ALL'); setStatusFilter('ALL'); }}
            className="px-6 py-2.5 bg-[#BDE0FE] hover:bg-[#A2D2FF] text-[#2B1B3D] font-extrabold text-xs rounded-2xl shadow transition transform hover:scale-105 active:scale-95 inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Search & Filters</span>
          </button>
        </div>
      ) : (
        /* Task Cards List */
        <div className="space-y-3">
          {filteredTasks.map((t) => {
            const canManage = t.owner_id === user?.id || (user?.account_type === 'ORG_ADMIN' && user?.organization_id === t.organization_id);

            return (
              <div
                key={t.id}
                className="bg-white dark:bg-[#1E142D] p-5 rounded-2xl border border-gray-200 dark:border-[#332352] hover:border-[#CDB4DB] dark:hover:border-[#FFC8DD] shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 hover:-translate-y-0.5"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(t.task_type)}
                    {getPriorityBadge(t.priority)}
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#120B1D] px-2.5 py-0.5 rounded flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{formatDueDateTime(t.due_date, t.due_time)}</span>
                    </span>
                  </div>

                  <h3 className={`text-base font-bold text-[#2B1B3D] dark:text-white ${t.status === 'COMPLETED' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                    {t.title}
                  </h3>

                  {t.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium line-clamp-2">
                      {t.description}
                    </p>
                  )}

                  {t.task_type === 'ORG' && (
                    <div className="flex items-center space-x-3 text-[11px] font-bold text-[#2B1B3D] dark:text-[#BDE0FE] pt-1">
                      <span className="flex items-center space-x-1">
                        <Building className="w-3.5 h-3.5" />
                        <span>{t.organization_name || 'Organization'}</span>
                      </span>
                      {t.assignee_name && (
                        <span className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                          <User className="w-3.5 h-3.5" />
                          <span>Assigned to: {t.assignee_name}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-[#332352]">
                  {getStatusButton(t)}

                  {canManage && (
                    <div className="flex items-center space-x-1 border-l border-gray-200 dark:border-[#332352] pl-2">
                      <button
                        onClick={() => onEditTask(t)}
                        title="Edit Task"
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-[#2B1B3D] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#332352] rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this task?')) {
                            deleteTask(t.id);
                          }
                        }}
                        title="Delete Task"
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-950/40 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
