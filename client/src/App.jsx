import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, Calendar, Plus, Menu } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskViews from './components/TaskViews';
import CalendarView from './components/CalendarView';
import UpcomingTasks from './components/UpcomingTasks';
import OrganizationView from './components/OrganizationView';
import ProfileView from './components/ProfileView';
import TaskModal from './components/TaskModal';
import MfaChallenge from './components/MfaChallenge';
import PasswordRecoveryModal from './components/PasswordRecoveryModal';
import WelcomeBanner from './components/WelcomeBanner';

const WELCOME_USER_KEY = 'eduflow_welcome_user';

const getPendingWelcomeUser = () => {
  try {
    return localStorage.getItem(WELCOME_USER_KEY);
  } catch (error) {
    return null;
  }
};

export default function App() {
  const { user, authUserId, isAuthenticated, loading, mfaRequired, passwordRecovery } = useAuth();
  const [welcomeUserId, setWelcomeUserId] = useState(getPendingWelcomeUser);

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Task Modal State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskDefaultCategory, setTaskDefaultCategory] = useState('CURRICULAR');

  const handleRegistered = (newAuthUserId) => {
    if (!newAuthUserId) return;
    try {
      localStorage.setItem(WELCOME_USER_KEY, newAuthUserId);
    } catch (error) {
      // The current page can still show the banner when storage is unavailable.
    }
    setWelcomeUserId(newAuthUserId);
  };

  const dismissWelcome = () => {
    try {
      localStorage.removeItem(WELCOME_USER_KEY);
    } catch (error) {
      // State remains the source of truth for this page session.
    }
    setWelcomeUserId(null);
  };

  if (passwordRecovery) {
    return <PasswordRecoveryModal />;
  }

  if (mfaRequired) {
    return <MfaChallenge />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#120B1D] text-edu-dark dark:text-white flex items-center justify-center transition-colors duration-300">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-edu-card dark:border-[#332352] border-t-edu-dark dark:border-t-[#FFC8DD] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-edu-dark dark:text-white">Loading EduFlow...</p>
        </div>
      </div>
    );
  }

  // Public Unauthenticated Visitor View
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          onOpenLogin={() => { setAuthMode('login'); setAuthModalOpen(true); }}
          onOpenRegister={() => { setAuthMode('register'); setAuthModalOpen(true); }}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onRegistered={handleRegistered}
          initialMode={authMode}
        />
      </>
    );
  }

  // Authenticated Student App Shell
  const handleOpenNewTask = (defaultCategory = 'CURRICULAR') => {
    const validCategories = ['CURRICULAR', 'EXTRACURRICULAR', 'ORG'];
    const sanitizedCategory = typeof defaultCategory === 'string' && validCategories.includes(defaultCategory.toUpperCase())
      ? defaultCategory.toUpperCase()
      : 'CURRICULAR';
    setTaskToEdit(null);
    setTaskDefaultCategory(sanitizedCategory);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setTaskModalOpen(true);
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onOpenTaskModal={() => handleOpenNewTask('CURRICULAR')} setActiveTab={setActiveTab} />;
      case 'tasks-all':
        return <TaskViews activeCategory="all" onOpenTaskModal={() => handleOpenNewTask('CURRICULAR')} onEditTask={handleEditTask} />;
      case 'tasks-curricular':
        return <TaskViews activeCategory="curricular" onOpenTaskModal={() => handleOpenNewTask('CURRICULAR')} onEditTask={handleEditTask} />;
      case 'tasks-extracurricular':
        return <TaskViews activeCategory="extracurricular" onOpenTaskModal={() => handleOpenNewTask('EXTRACURRICULAR')} onEditTask={handleEditTask} />;
      case 'tasks-org':
        return <TaskViews activeCategory="org" onOpenTaskModal={() => handleOpenNewTask('ORG')} onEditTask={handleEditTask} />;
      case 'tasks-archived':
        return <TaskViews activeCategory="archived" onOpenTaskModal={() => handleOpenNewTask('CURRICULAR')} onEditTask={handleEditTask} />;
      case 'calendar':
        return <CalendarView onEditTask={handleEditTask} />;
      case 'upcoming':
        return <UpcomingTasks onEditTask={handleEditTask} />;
      case 'account-profile':
        return <ProfileView />;
      case 'account-org':
        return <OrganizationView onOpenTaskModal={() => handleOpenNewTask('ORG')} />;
      default:
        return <Dashboard onOpenTaskModal={() => handleOpenNewTask('CURRICULAR')} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#120B1D] text-edu-dark dark:text-gray-100 flex flex-col font-sans transition-colors duration-300">
      <Navbar
        onOpenTaskModal={() => handleOpenNewTask('CURRICULAR')}
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex bg-gray-50 dark:bg-[#120B1D] transition-colors duration-300">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 min-w-0 pb-24 lg:pb-8 overflow-y-auto bg-gray-50 dark:bg-[#120B1D] transition-colors duration-300">
          {welcomeUserId === authUserId && (
            <WelcomeBanner
              name={user?.name}
              onDismiss={dismissWelcome}
              onGetStarted={() => {
                dismissWelcome();
                handleOpenNewTask();
              }}
            />
          )}
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1E142D]/95 backdrop-blur-lg border-t border-gray-200 dark:border-[#332352] px-2 py-1.5 flex items-center justify-around shadow-lg"
      >
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            activeTab === 'dashboard'
              ? 'text-[#2B1B3D] dark:text-[#FFAFCC] font-extrabold'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tasks-all')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            activeTab.startsWith('tasks')
              ? 'text-[#2B1B3D] dark:text-[#FFAFCC] font-extrabold'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Tasks</span>
        </button>

        {/* Center Quick Add Action Button */}
        <button
          type="button"
          onClick={() => handleOpenNewTask('CURRICULAR')}
          className="flex flex-col items-center justify-center -mt-5"
          aria-label="Create new task"
        >
          <div className="w-11 h-11 rounded-full bg-[#FFC8DD] hover:bg-[#FFAFCC] text-[#2B1B3D] shadow-lg flex items-center justify-center transition transform active:scale-95 border-2 border-white dark:border-[#1E142D]">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-extrabold text-[#2B1B3D] dark:text-[#FFC8DD] mt-0.5">New</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            activeTab === 'calendar'
              ? 'text-[#2B1B3D] dark:text-[#FFAFCC] font-extrabold'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            mobileMenuOpen
              ? 'text-[#2B1B3D] dark:text-[#FFAFCC] font-extrabold'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium'
          }`}
          aria-label="Open full menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultCategory={taskDefaultCategory}
      />
    </div>
  );
}
