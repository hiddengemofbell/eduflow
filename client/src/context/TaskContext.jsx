import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export const formatDueDateTime = (dueDate, dueTime) => {
  if (!dueDate) return '';
  if (!dueTime) return `${dueDate} (All Day)`;

  // Convert "14:30" to "2:30 PM"
  try {
    const [hours, minutes] = dueTime.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 || 12;
    return `${dueDate} at ${formattedHours}:${minutes} ${ampm}`;
  } catch (e) {
    return `${dueDate} ${dueTime}`;
  }
};

export const TaskProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState(() => {
    const cached = localStorage.getItem('eduflow_offline_tasks');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
    localStorage.setItem('eduflow_offline_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    if (!token || !isAuthenticated) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setIsOffline(false);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to fetch tasks.');
      }
    } catch (err) {
      console.warn('Network unavailable, running in offline mode with local tasks.', err);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (taskData) => {
    const optimisticTask = {
      id: Date.now(),
      owner_id: 1,
      title: taskData.title,
      description: taskData.description || '',
      task_type: taskData.task_type || 'CURRICULAR',
      due_date: taskData.due_date,
      due_time: taskData.due_time || null,
      priority: taskData.priority || 'MEDIUM',
      status: taskData.status || 'PENDING',
      assigned_to: taskData.assigned_to || null,
      created_at: new Date().toISOString()
    };

    if (isOffline) {
      setTasks(prev => [optimisticTask, ...prev]);
      return optimisticTask;
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
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create task.');
      }
      await fetchTasks();
      return data.task;
    } catch (err) {
      setTasks(prev => [optimisticTask, ...prev]);
      setIsOffline(true);
      return optimisticTask;
    }
  };

  const updateTask = async (id, updateData) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updateData, updated_at: new Date().toISOString() } : t));

    if (isOffline) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update task.');
      }
      await fetchTasks();
    } catch (err) {
      console.warn('Updated offline:', err);
      setIsOffline(true);
    }
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));

    if (isOffline) return true;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete task.');
      }
      await fetchTasks();
      return true;
    } catch (err) {
      console.warn('Deleted offline:', err);
      setIsOffline(true);
      return true;
    }
  };

  const isDueToday = (dueDateStr) => {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    const today = new Date();
    return due.toDateString() === today.toDateString();
  };

  const isOverdue = (dueDateStr, status) => {
    if (!dueDateStr || status === 'COMPLETED') return false;
    const due = new Date(dueDateStr);
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
