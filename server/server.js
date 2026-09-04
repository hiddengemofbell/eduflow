const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./config/db');

const authRoutes = require('./routes/auth');
const orgRoutes = require('./routes/organizations');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database Tables
initDb();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'EduFlow Full-Stack Server', timestamp: new Date().toISOString() });
});

// Serve Client Static Build Files (Merged Single-Server)
const clientBuildPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// SPA Fallback: Route all non-API GET requests to index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.resolve(clientBuildPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'An internal server error occurred.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`EduFlow Full-Stack App running on http://localhost:${PORT}`);
  });
}

module.exports = app;
