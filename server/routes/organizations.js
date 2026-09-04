const express = require('express');
const router = express.Router();
const { query, getOne, run, transaction } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

const generateJoinCode = async (getOneFromDatabase = getOne) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = crypto.randomBytes(5).toString('hex').slice(0, 8).toUpperCase();
    const existing = await getOneFromDatabase('SELECT id FROM organizations WHERE join_code = ?', [code]);
    if (!existing) return code;
  }
  throw new Error('Unable to generate a unique organization join code.');
};

// Create Organization
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 150) {
      return res.status(400).json({ message: 'Organization name is required.' });
    }

    const currentUser = await getOne('SELECT id, organization_id FROM users WHERE id = ?', [req.user.id]);
    if (!currentUser) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }
    if (currentUser.organization_id) {
      return res.status(409).json({ message: 'Leave the current organization before creating another one.' });
    }

    const org = await transaction(async ({ getOne: txGetOne, run: txRun }) => {
      const joinCode = await generateJoinCode(txGetOne);
      const result = await txRun(
        'INSERT INTO organizations (name, join_code, created_by) VALUES (?, ?, ?)',
        [name.trim(), joinCode, req.user.id]
      );

      await txRun(
        'UPDATE users SET account_type = ?, organization_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['ORG_ADMIN', result.id, req.user.id]
      );

      return txGetOne('SELECT * FROM organizations WHERE id = ?', [result.id]);
    });

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
    const { join_code } = req.body || {};
    if (typeof join_code !== 'string' || !/^[A-F0-9]{8}$/.test(join_code.trim().toUpperCase())) {
      return res.status(400).json({ message: 'Join code is required.' });
    }

    const currentUser = await getOne('SELECT id, organization_id FROM users WHERE id = ?', [req.user.id]);
    if (!currentUser) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }
    if (currentUser.organization_id) {
      return res.status(409).json({ message: 'You already belong to an organization.' });
    }

    const org = await getOne('SELECT * FROM organizations WHERE join_code = ?', [join_code.trim().toUpperCase()]);
    if (!org) {
      return res.status(404).json({ message: 'No organization found with this join code.' });
    }

    await run(
      'UPDATE users SET organization_id = ?, account_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [org.id, 'ORG_MEMBER', req.user.id]
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
