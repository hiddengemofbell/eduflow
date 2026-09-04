const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const PORT = process.env.PORT || 5000;

// Serve Client Static Build Files (Merged Single-Server)
const clientBuildPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// SPA Fallback: Route all non-API GET requests to index.html
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.resolve(clientBuildPath, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`EduFlow Full-Stack App running on http://localhost:${PORT}`);
  });
}

module.exports = app;
