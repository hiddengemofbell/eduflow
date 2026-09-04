const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('../server/config/db');

const authRoutes = require('../server/routes/auth');
const orgRoutes = require('../server/routes/organizations');
const taskRoutes = require('../server/routes/tasks');

const app = express();

app.use(cors());
app.use(express.json());

// Verify the database connection during cold starts. Individual requests still
// surface a clear error if the deployment has not been configured yet.
initDb().catch((error) => console.error('Database initialization failed:', error.message));

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'EduFlow Vercel Serverless API', timestamp: new Date().toISOString() });
});

module.exports = app;
