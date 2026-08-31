import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import { X, UserCheck, Clock, Calendar, Tag, Flag, CheckCircle2, FileText, Sparkles } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, taskToEdit = null, defaultCategory = 'CURRICULAR' }) {
  const { addTask, updateTask } = useTasks();
  const { user, token } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState(defaultCategory);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('PENDING');
  const [assignedTo, setAssignedTo] = useState('');
  const [orgMembers, setOrgMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.account_type === 'ORG_ADMIN' && user?.organization_id && token) {
      fetch('/api/organizations/members', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setOrgMembers(data.members || []))
        .catch(err => console.error('Error loading members:', err));
    }
  }, [user, token]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setTaskType(taskToEdit.task_type || defaultCategory);
      setDueDate(taskToEdit.due_date ? taskToEdit.due_date.split('T')[0] : '');
      setDueTime(taskToEdit.due_time || '');
      setPriority(taskToEdit.priority || 'MEDIUM');
      setStatus(taskToEdit.status || 'PENDING');
      setAssignedTo(taskToEdit.assigned_to || '');
    } else {
      setTitle('');
      setDescription('');
      setTaskType(defaultCategory);
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('');
      setPriority('MEDIUM');
      setStatus('PENDING');
      setAssignedTo('');
    }
  }, [taskToEdit, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        task_type: taskType,
        due_date: dueDate,
        due_time: dueTime ? dueTime.trim() : null,
        priority,
        status,
        assigned_to: assignedTo ? parseInt(assignedTo) : null
      };

      if (taskToEdit) {
        await updateTask(taskToEdit.id, payload);
      } else {
        await addTask(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: 'CURRICULAR', label: 'Curricular (Academic Requirement)' },
    { value: 'EXTRACURRICULAR', label: 'Extracurricular & Personal Prep' },
    ...(user?.account_type === 'ORG_ADMIN' ? [{ value: 'ORG', label: 'Organization Assigned' }] : [])
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'HIGH', label: 'High Priority' }
  ];

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  const memberOptions = [
    { value: '', label: 'Unassigned (Whole Organization)' },
    ...orgMembers.map(m => ({ value: m.id, label: `${m.name} (${m.email})` }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B3D]/70 dark:bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1E142D] w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 dark:border-[#332352] overflow-visible transform animate-scale-in transition-colors duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#CDB4DB]/40 via-[#FFC8DD]/40 to-[#BDE0FE]/40 dark:from-[#2B1B3D] dark:to-[#382550] p-6 relative flex items-center justify-between border-b border-gray-100 dark:border-[#332352] rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2B1B3D] dark:bg-[#FFC8DD] text-white dark:text-[#2B1B3D] flex items-center justify-center shadow font-bold">
              <Sparkles className="w-5 h-5 text-[#FFC8DD] dark:text-[#2B1B3D]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#2B1B3D] dark:text-white">
                {taskToEdit ? 'Edit Task' : 'Create New Task'}
              </h2>
              <p className="text-xs font-bold text-gray-600 dark:text-[#FFC8DD] mt-0.5">
                Set details, visual calendar date, time, and priority.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#2B1B3D] dark:text-gray-300 hover:bg-white/80 dark:hover:bg-[#332352] p-2 rounded-full transition transform hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto rounded-b-3xl">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300 mb-1.5 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-[#2B1B3D] dark:text-[#FFAFCC]" />
              <span>Task Title</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Midterm Project Presentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-[#332352] bg-gray-50/50 dark:bg-[#120B1D] text-[#2B1B3D] dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD] dark:focus:ring-[#FFAFCC] transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Add extra context, requirements, links, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-[#332352] bg-gray-50/50 dark:bg-[#120B1D] text-[#2B1B3D] dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD] dark:focus:ring-[#FFAFCC] transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300 mb-1.5 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-[#2B1B3D] dark:text-[#FFAFCC]" />
              <span>Category</span>
            </label>
            <CustomSelect
              value={taskType}
              onChange={setTaskType}
              options={categoryOptions}
            />
          </div>

          {/* Row 2: Visual Calendar Date Picker & Optional Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300 mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#2B1B3D] dark:text-[#FFAFCC]" />
                <span>Due Date (Calendar)</span>
              </label>
              <CustomDatePicker
                value={dueDate}
                onChange={setDueDate}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2B1B3D] dark:text-[#FFAFCC]" />
                  <span>Time</span>
                </span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400 lowercase">optional</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-2.5 text-xs font-extrabold border border-gray-200 dark:border-[#332352] bg-gray-50/50 dark:bg-[#120B1D] text-[#2B1B3D] dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFC8DD] dark:focus:ring-[#FFAFCC] transition cursor-pointer"
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium italic -mt-2">
            💡 Leave time blank for All-Day events and deadlines.
          </p>

          {/* Row 3: Priority & Status Custom Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300 mb-1.5 flex items-center space-x-1.5">
                <Flag className="w-3.5 h-3.5 text-[#2B1B3D] dark:text-[#FFAFCC]" />
                <span>Priority</span>
              </label>
              <CustomSelect
                value={priority}
                onChange={setPriority}
                options={priorityOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#2B1B3D] dark:text-gray-300 mb-1.5 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2B1B3D] dark:text-[#FFAFCC]" />
                <span>Status</span>
              </label>
              <CustomSelect
                value={status}
                onChange={setStatus}
                options={statusOptions}
              />
            </div>
          </div>

          {/* Org Assignment */}
          {user?.account_type === 'ORG_ADMIN' && taskType === 'ORG' && (
            <div className="p-4 bg-[#FFC8DD]/20 dark:bg-[#332352] rounded-2xl border border-[#FFC8DD]/40 dark:border-[#3E285C] space-y-2">
              <label className="block text-xs font-bold uppercase text-[#2B1B3D] dark:text-white flex items-center space-x-1.5 mb-1.5">
                <UserCheck className="w-4 h-4 text-[#2B1B3D] dark:text-[#FFAFCC]" />
                <span>Assign to Organization Member</span>
              </label>
              <CustomSelect
                value={assignedTo}
                onChange={setAssignedTo}
                options={memberOptions}
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-[#332352]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-bold text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#332352] rounded-2xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] font-extrabold text-xs rounded-2xl shadow-md transition transform hover:scale-[1.02] active:scale-95"
            >
              {loading ? 'Saving...' : taskToEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
