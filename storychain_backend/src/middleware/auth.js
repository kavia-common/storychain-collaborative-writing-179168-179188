const jwt = require('jsonwebtoken');

/**
 * Authentication middleware and helpers for JWT.
 * Uses JWT_SECRET from env and builds tokens with user id and username.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'insecure-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// PUBLIC_INTERFACE
function signToken(payload) {
  /** Create a JWT for the given payload. */
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// PUBLIC_INTERFACE
function verifyToken(token) {
  /** Verify a JWT and return decoded payload. */
  return jwt.verify(token, JWT_SECRET);
}

// PUBLIC_INTERFACE
function authRequired(req, res, next) {
  /**
   * Express middleware to require a valid JWT in Authorization header.
   * Attaches req.user if valid.
   */
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header Bearer <token>' });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  signToken,
  verifyToken,
  authRequired,
};
