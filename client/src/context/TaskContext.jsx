import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { parseLocalDate } from '../utils/dates';

const TaskContext = createContext();

export const formatDueDateTime = (dueDate, dueTime) => {
  if (!dueDate) return '';
  const dateStr = typeof dueDate === 'string' && dueDate.includes('T') ? dueDate.split('T')[0] : String(dueDate);
  if (!dueTime) return `${dateStr} (All Day)`;

  // Convert "14:30" to "2:30 PM"
  try {
    const [hours, minutes] = dueTime.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 || 12;
    return `${dateStr} at ${formattedHours}:${minutes} ${ampm}`;
  } catch (e) {
    return `${dateStr} ${dueTime}`;
  }
};

export const TaskProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [cacheOwnerId, setCacheOwnerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const inFlightUpdatesRef = useRef(new Map());

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setTasks([]);
      setCacheOwnerId(null);
      return;
    }

    const userId = String(user.id);
    try {
      const cached = localStorage.getItem(`eduflow_offline_tasks:${userId}`);
      const parsed = cached ? JSON.parse(cached) : [];
      setTasks(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.warn('Ignoring an invalid offline task cache.', error);
      localStorage.removeItem(`eduflow_offline_tasks:${userId}`);
      setTasks([]);
    }
    setCacheOwnerId(userId);
  }, [user?.id]);

  useEffect(() => {
    const userId = user?.id ? String(user.id) : null;
    if (userId && cacheOwnerId === userId) {
      localStorage.setItem(`eduflow_offline_tasks:${userId}`, JSON.stringify(tasks));
    }
  }, [tasks, cacheOwnerId, user?.id]);

  const fetchTasks = useCallback(async (options = {}) => {
    const silent = typeof options === 'boolean' ? options : Boolean(options?.silent);
    if (!token || !isAuthenticated) {
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const serverTasks = Array.isArray(data.tasks) ? data.tasks : [];
        setTasks(prevTasks => {
          return serverTasks.map(serverTask => {
            const pending = inFlightUpdatesRef.current.get(String(serverTask.id));
            if (pending) {
              return { ...serverTask, ...pending };
            }
            return serverTask;
          });
        });
        setIsOffline(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || 'Failed to fetch tasks.');
      }
    } catch (err) {
      console.warn('Network unavailable, running in offline mode with local tasks.', err);
      setIsOffline(true);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [token, isAuthenticated, user?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (taskData) => {
    if (isOffline) {
      throw new Error('You are offline. Connect to the internet before creating a task.');
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create task.');
      }
      if (data.task) {
        setTasks(prev => [data.task, ...prev]);
      } else {
        await fetchTasks({ silent: true });
      }
      return data.task;
    } catch (err) {
      if (!navigator.onLine) setIsOffline(true);
      throw err;
    }
  };

  const updateTask = async (id, updateData) => {
    const stringId = String(id);
    const previousTasks = tasks;
    inFlightUpdatesRef.current.set(stringId, updateData);

    setTasks(prev => prev.map(t => String(t.id) === stringId ? { ...t, ...updateData, updated_at: new Date().toISOString() } : t));

    if (isOffline) {
      inFlightUpdatesRef.current.delete(stringId);
      setTasks(previousTasks);
      throw new Error('You are offline. Connect to the internet before updating a task.');
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update task.');
      }
      if (data.task) {
        setTasks(prev => prev.map(t => String(t.id) === stringId ? data.task : t));
      } else {
        await fetchTasks({ silent: true });
      }
    } catch (err) {
      setTasks(previousTasks);
      if (!navigator.onLine) setIsOffline(true);
      throw err;
    } finally {
      inFlightUpdatesRef.current.delete(stringId);
    }
  };

  const deleteTask = async (id) => {
    const stringId = String(id);
    const previousTasks = tasks;
    setTasks(prev => prev.filter(t => String(t.id) !== stringId));

    if (isOffline) {
      setTasks(previousTasks);
      throw new Error('You are offline. Connect to the internet before deleting a task.');
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete task.');
      }
      return true;
    } catch (err) {
      setTasks(previousTasks);
      if (!navigator.onLine) setIsOffline(true);
      throw err;
    }
  };

  const isDueToday = (dueDateStr) => {
    if (!dueDateStr) return false;
    const due = parseLocalDate(dueDateStr);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  };

  const isOverdue = (dueDateStr, status) => {
    if (!dueDateStr || status === 'COMPLETED') return false;
    const due = parseLocalDate(dueDateStr);
    const now = new Date();
    return due < now && due.toDateString() !== now.toDateString();
  };

  const dueTodayTasks = tasks.filter(t => isDueToday(t.due_date) && t.status !== 'COMPLETED');
  const overdueTasks = tasks.filter(t => isOverdue(t.due_date, t.status));

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    curricular: tasks.filter(t => t.task_type === 'CURRICULAR').length,
    extracurricular: tasks.filter(t => t.task_type === 'EXTRACURRICULAR').length,
    org: tasks.filter(t => t.task_type === 'ORG').length,
    dueToday: dueTodayTasks.length,
    overdue: overdueTasks.length
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      error,
      stats,
      isOffline,
      dueTodayTasks,
      overdueTasks,
      fetchTasks,
      addTask,
      updateTask,
      deleteTask
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
