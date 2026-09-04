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

// Initialize JSON database
initDb();

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'EduFlow Vercel Serverless API', timestamp: new Date().toISOString() });
});

module.exports = app;
