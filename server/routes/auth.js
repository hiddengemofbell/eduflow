const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, run } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      account_type: user.account_type,
      organization_id: user.organization_id
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, account_type, join_code, org_name } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const type = account_type || 'INDIVIDUAL';
    if (!['INDIVIDUAL', 'ORG_ADMIN', 'ORG_MEMBER'].includes(type)) {
      return res.status(400).json({ message: 'Invalid account type.' });
    }

    const existingUser = await getOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email address is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let organizationId = null;
    let createdOrg = null;

    // Handle Organization Joining if ORG_MEMBER with code
    if (type === 'ORG_MEMBER' && join_code) {
      const org = await getOne('SELECT id, name FROM organizations WHERE join_code = ?', [join_code.trim().toUpperCase()]);
      if (!org) {
        return res.status(400).json({ message: 'Invalid organization join code.' });
      }
      organizationId = org.id;
      createdOrg = org;
    }

    // Insert user first
    const result = await run(
      `INSERT INTO users (name, email, password, account_type, organization_id) VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, type, organizationId]
    );

    const userId = result.id;

    // If ORG_ADMIN and org_name provided, create organization automatically
    if (type === 'ORG_ADMIN' && org_name) {
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const orgResult = await run(
        `INSERT INTO organizations (name, join_code, created_by) VALUES (?, ?, ?)`,
        [org_name, generatedCode, userId]
      );
      organizationId = orgResult.id;
      // Update user with organization_id
      await run('UPDATE users SET organization_id = ? WHERE id = ?', [organizationId, userId]);
      createdOrg = { id: organizationId, name: org_name, join_code: generatedCode };
    }

    const newUser = await getOne(
      'SELECT id, name, email, account_type, organization_id, created_at FROM users WHERE id = ?',
      [userId]
    );

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        ...newUser,
        organization: createdOrg
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    let organization = null;
    if (user.organization_id) {
      organization = await getOne('SELECT id, name, join_code FROM organizations WHERE id = ?', [user.organization_id]);
    }

    const token = generateToken(user);

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      account_type: user.account_type,
      organization_id: user.organization_id,
      created_at: user.created_at,
      organization
    };

    res.json({
      message: 'Login successful',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getOne('SELECT id, name, email, account_type, organization_id, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let organization = null;
    if (user.organization_id) {
      organization = await getOne('SELECT id, name, join_code FROM organizations WHERE id = ?', [user.organization_id]);
    }

    res.json({
      user: {
        ...user,
        organization
      }
    });
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ message: 'Server error fetching user details.' });
  }
});

module.exports = router;
