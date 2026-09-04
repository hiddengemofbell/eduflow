const { getOne } = require('../config/db');
const {
  getSupabaseClient,
  isSupabaseConfigured
} = require('../config/supabase');

const getTokenAssuranceLevel = (accessToken) => {
  try {
    return JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8')).aal || null;
  } catch (error) {
    return null;
  }
};

const requiresMfaVerification = (authUser, accessToken) => {
  const hasVerifiedFactor = Array.isArray(authUser?.factors)
    && authUser.factors.some((factor) => factor.status === 'verified');
  return hasVerifiedFactor && getTokenAssuranceLevel(accessToken) !== 'aal2';
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const tokenMatch = typeof authHeader === 'string'
    ? authHeader.match(/^Bearer\s+([^\s]+)$/i)
    : null;
  const accessToken = tokenMatch?.[1];

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token required. Authorization denied.' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ message: 'Authentication is not configured on this server.' });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(accessToken);
    const authUser = data?.user;

    if (error || !authUser) {
      return res.status(403).json({ message: 'Invalid or expired access token.' });
    }

    if (requiresMfaVerification(authUser, accessToken)) {
      return res.status(403).json({
        code: 'MFA_REQUIRED',
        message: 'Complete two-factor authentication to continue.'
      });
    }

    if (!authUser.email_confirmed_at) {
      return res.status(403).json({ message: 'Confirm your email address before using EduFlow.' });
    }

    const profile = await getOne(
      `SELECT id, auth_user_id, name, email, account_type, organization_id, created_at
       FROM users
       WHERE auth_user_id = ?`,
      [authUser.id]
    );

    if (!profile) {
      return res.status(403).json({ message: 'No EduFlow profile is linked to this account.' });
    }

    req.user = {
      ...profile,
      authUserId: authUser.id,
      confirmedEmail: authUser.email
    };
    return next();
  } catch (error) {
    console.error('Authentication validation error:', error.message);
    return res.status(503).json({ message: 'Authentication service is temporarily unavailable.' });
  }
};

module.exports = { authenticateToken, getTokenAssuranceLevel, requiresMfaVerification };
