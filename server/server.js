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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'EduFlow API Server', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'An internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`EduFlow server running on http://localhost:${PORT}`);
});
