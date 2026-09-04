const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, transaction } = require('../config/db');
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
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateJoinCode = async (getOneFromDatabase = getOne) => {
  // Generate eight cryptographically random hexadecimal characters and retry
  // on the small chance of a unique-index collision.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = crypto.randomBytes(5).toString('hex').slice(0, 8).toUpperCase();
    const existing = await getOneFromDatabase('SELECT id FROM organizations WHERE join_code = ?', [code]);
    if (!existing) return code;
  }
  throw new Error('Unable to generate a unique organization join code.');
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, account_type, join_code, org_name } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const passwordBytes = typeof password === 'string' ? Buffer.byteLength(password, 'utf8') : 0;
    const normalizedJoinCode = typeof join_code === 'string' ? join_code.trim().toUpperCase() : '';
    const normalizedOrgName = typeof org_name === 'string' ? org_name.trim() : '';

    if (!normalizedName || normalizedName.length > 100 || normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || typeof password !== 'string' || password.length < 8 || passwordBytes > 72) {
      return res.status(400).json({ message: 'Use a valid name and email, and a password between 8 and 72 bytes.' });
    }

    const requestedType = account_type || 'INDIVIDUAL';
    if (!['INDIVIDUAL', 'ORG_ADMIN', 'ORG_MEMBER'].includes(requestedType)) {
      return res.status(400).json({ message: 'Invalid account type.' });
    }
    if (normalizedJoinCode && !/^[A-F0-9]{8}$/.test(normalizedJoinCode)) {
      return res.status(400).json({ message: 'Organization join code must contain 8 hexadecimal characters.' });
    }
    if (requestedType === 'ORG_ADMIN' && normalizedJoinCode) {
      return res.status(400).json({ message: 'An organization admin cannot register with a member join code.' });
    }
    if (requestedType === 'ORG_MEMBER' && !normalizedJoinCode) {
      return res.status(400).json({ message: 'Organization members must provide a join code.' });
    }
    if (org_name !== undefined && typeof org_name !== 'string') {
      return res.status(400).json({ message: 'Organization name must be text.' });
    }
    if (normalizedOrgName.length > 150) {
      return res.status(400).json({ message: 'Organization name must be between 1 and 150 characters.' });
    }

    // The registration UI presents a student account with an optional join code.
    // Supplying that code makes the account an organization member.
    const type = normalizedJoinCode ? 'ORG_MEMBER' : requestedType;

    const existingUser = await getOne('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUser) {
      return res.status(409).json({ message: 'Email address is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { newUser, createdOrg } = await transaction(async ({ getOne: txGetOne, run: txRun }) => {
      let organizationId = null;
      let organization = null;

      if (type === 'ORG_MEMBER') {
        organization = await txGetOne('SELECT id, name, join_code FROM organizations WHERE join_code = ?', [normalizedJoinCode]);
        if (!organization) {
          const error = new Error('Invalid organization join code.');
          error.status = 400;
          throw error;
        }
        organizationId = organization.id;
      }

      const result = await txRun(
        'INSERT INTO users (name, email, password, account_type, organization_id) VALUES (?, ?, ?, ?, ?)',
        [normalizedName, normalizedEmail, hashedPassword, type, organizationId]
      );
      const userId = result.id;

      if (type === 'ORG_ADMIN' && normalizedOrgName) {
        const generatedCode = await generateJoinCode(txGetOne);
        const orgResult = await txRun(
          'INSERT INTO organizations (name, join_code, created_by) VALUES (?, ?, ?)',
          [normalizedOrgName, generatedCode, userId]
        );
        organizationId = orgResult.id;
        await txRun('UPDATE users SET organization_id = ? WHERE id = ?', [organizationId, userId]);
        organization = { id: organizationId, name: normalizedOrgName, join_code: generatedCode };
      }

      const insertedUser = await txGetOne(
        'SELECT id, name, email, account_type, organization_id, created_at FROM users WHERE id = ?',
        [userId]
      );
      return { newUser: insertedUser, createdOrg: organization };
    });

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
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email address is already registered.' });
    }
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string' || email.trim().length > 254 || Buffer.byteLength(password, 'utf8') > 72) {
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
