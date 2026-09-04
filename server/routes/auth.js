const express = require('express');
const { getOne } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
  try {
    let organization = null;
    if (req.user.organization_id) {
      organization = await getOne(
        'SELECT id, name, join_code FROM organizations WHERE id = ?',
        [req.user.organization_id]
      );
    }

    return res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.confirmedEmail || req.user.email,
        account_type: req.user.account_type,
        organization_id: req.user.organization_id,
        created_at: req.user.created_at,
        organization
      }
    });
  } catch (error) {
    console.error('Fetch me error:', error);
    return res.status(500).json({ message: 'Server error fetching user details.' });
  }
});

module.exports = router;
