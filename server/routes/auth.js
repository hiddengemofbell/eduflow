const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, run } = require('../config/db');
const { authenticateToken, JWT_SECRET, hasJwtSecret } = require('../middleware/auth');
const crypto = require('crypto');

// Helper to generate JWT
const generateToken = (user) => {
  if (!hasJwtSecret()) {
    throw new Error('JWT_SECRET must be set to a value of at least 32 characters.');
  }
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

const generateJoinCode = async () => {
  // Six random base-36 characters have only ~2.2B combinations; retry on the
  // small chance of a collision rather than relying on Math.random().
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = crypto.randomBytes(5).toString('hex').slice(0, 8).toUpperCase();
    const existing = await getOne('SELECT id FROM organizations WHERE join_code = ?', [code]);
    if (!existing) return code;
  }
  throw new Error('Unable to generate a unique organization join code.');
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, account_type, join_code, org_name } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (typeof name !== 'string' || name.trim().length > 100 || typeof email !== 'string' || email.trim().length > 254 || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Use a name and email of valid length, and a password of at least 8 characters.' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const type = account_type || 'INDIVIDUAL';
    if (!['INDIVIDUAL', 'ORG_ADMIN', 'ORG_MEMBER'].includes(type)) {
      return res.status(400).json({ message: 'Invalid account type.' });
    }

    const existingUser = await getOne('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
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
      [name.trim(), normalizedEmail, hashedPassword, type, organizationId]
    );

    const userId = result.id;

    // If ORG_ADMIN and org_name provided, create organization automatically
    if (type === 'ORG_ADMIN' && org_name) {
      if (typeof org_name !== 'string' || !org_name.trim() || org_name.trim().length > 150) {
        return res.status(400).json({ message: 'Organization name must be between 1 and 150 characters.' });
      }
      const generatedCode = await generateJoinCode();
      const orgResult = await run(
        `INSERT INTO organizations (name, join_code, created_by) VALUES (?, ?, ?)`,
        [org_name.trim(), generatedCode, userId]
      );
      organizationId = orgResult.id;
      // Update user with organization_id
      await run('UPDATE users SET organization_id = ? WHERE id = ?', [organizationId, userId]);
      createdOrg = { id: organizationId, name: org_name.trim(), join_code: generatedCode };
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

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
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
