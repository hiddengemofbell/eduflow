const express = require('express');
const router = express.Router();
const { query, getOne, run } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Create Organization
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Organization name is required.' });
    }

    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await run(
      'INSERT INTO organizations (name, join_code, created_by) VALUES (?, ?, ?)',
      [name, joinCode, req.user.id]
    );

    const orgId = result.id;
    // Update user to be ORG_ADMIN of this new org
    await run(
      'UPDATE users SET account_type = ?, organization_id = ? WHERE id = ?',
      ['ORG_ADMIN', orgId, req.user.id]
    );

    const org = await getOne('SELECT * FROM organizations WHERE id = ?', [orgId]);

    res.status(201).json({
      message: 'Organization created successfully.',
      organization: org
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ message: 'Server error creating organization.' });
  }
});

// Join Organization via Join Code
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { join_code } = req.body;
    if (!join_code) {
      return res.status(400).json({ message: 'Join code is required.' });
    }

    const org = await getOne('SELECT * FROM organizations WHERE join_code = ?', [join_code.trim().toUpperCase()]);
    if (!org) {
      return res.status(404).json({ message: 'No organization found with this join code.' });
    }

    const newAccountType = req.user.account_type === 'ORG_ADMIN' ? 'ORG_ADMIN' : 'ORG_MEMBER';

    await run(
      'UPDATE users SET organization_id = ?, account_type = ? WHERE id = ?',
      [org.id, newAccountType, req.user.id]
    );

    res.json({
      message: `Successfully joined ${org.name}!`,
      organization: org
    });
  } catch (error) {
    console.error('Join organization error:', error);
    res.status(500).json({ message: 'Server error joining organization.' });
  }
});

// Get Organization Members
router.get('/members', authenticateToken, async (req, res) => {
  try {
    const currentUser = await getOne('SELECT organization_id FROM users WHERE id = ?', [req.user.id]);
    if (!currentUser || !currentUser.organization_id) {
      return res.json({ members: [] });
    }

    const members = await query(
      'SELECT id, name, email, account_type, created_at FROM users WHERE organization_id = ? ORDER BY name ASC',
      [currentUser.organization_id]
    );

    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ message: 'Server error fetching organization members.' });
  }
});

module.exports = router;
