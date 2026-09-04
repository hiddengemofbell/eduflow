const jwt = require('jsonwebtoken');

// A hard-coded fallback lets anyone who can read the source forge sessions.
// Local development and every deployed environment must provide this value.
const JWT_SECRET = process.env.JWT_SECRET;

const hasJwtSecret = () => typeof JWT_SECRET === 'string' && JWT_SECRET.length >= 32;

const authenticateToken = (req, res, next) => {
  if (!hasJwtSecret()) {
    return res.status(500).json({ message: 'Authentication is not configured on this server.' });
  }
  const authHeader = req.headers['authorization'];
  const tokenMatch = typeof authHeader === 'string' ? authHeader.match(/^Bearer\s+([^\s]+)$/i) : null;
  const token = tokenMatch?.[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required. Authorization denied.' });
  }

  jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
    if (err || !user || !/^\d+$/.test(String(user.id))) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken,
  JWT_SECRET,
  hasJwtSecret
};
