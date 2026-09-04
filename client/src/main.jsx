import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { TaskProvider } from './context/TaskContext'

// Register PWA Service Worker for offline app capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('EduFlow ServiceWorker registered:', reg.scope))
      .catch(err => console.error('EduFlow ServiceWorker registration failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <App />
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
