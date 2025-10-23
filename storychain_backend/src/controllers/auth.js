const bcrypt = require('bcrypt');
const { query } = require('../db');
const { signToken } = require('../middleware/auth');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

class AuthController {
  // PUBLIC_INTERFACE
  async signup(req, res) {
    /** Signup a new user with email, username, password. */
    try {
      const { email, username, password, displayName } = req.body || {};
      if (!email || !username || !password) {
        return res.status(400).json({ error: 'email, username and password are required' });
      }
      const existing = await query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email or username already exists' });
      }
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await query(
        `INSERT INTO users (email, username, password_hash, display_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, username, display_name AS "displayName", avatar_url AS "avatarUrl", created_at AS "createdAt"`,
        [email, username, passwordHash, displayName || null]
      );
      const user = result.rows[0];
      const token = signToken({ id: user.id, username: user.username });
      return res.status(201).json({ user, token });
    } catch (err) {
      console.error('[auth.signup] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUBLIC_INTERFACE
  async login(req, res) {
    /** Login user with email or username plus password. */
    try {
      const { email, username, password } = req.body || {};
      if ((!email && !username) || !password) {
        return res.status(400).json({ error: 'email or username and password are required' });
      }
      const by = email ? ['email', email] : ['username', username];
      const found = await query(
        `SELECT id, email, username, password_hash FROM users WHERE ${by[0]} = $1`,
        [by[1]]
      );
      if (found.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const userRow = found.rows[0];
      const ok = userRow.password_hash
        ? await bcrypt.compare(password, userRow.password_hash)
        : false;
      if (!ok) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const userInfoRes = await query(
        `SELECT id, email, username, display_name AS "displayName", avatar_url AS "avatarUrl", created_at AS "createdAt"
         FROM users WHERE id = $1`,
        [userRow.id]
      );
      const user = userInfoRes.rows[0];
      const token = signToken({ id: user.id, username: user.username });
      return res.json({ user, token });
    } catch (err) {
      console.error('[auth.login] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUBLIC_INTERFACE
  async logout(req, res) {
    /** Stateless JWT logout (client discards token). */
    return res.json({ success: true });
  }

  // PUBLIC_INTERFACE
  async me(req, res) {
    /** Get current user profile from req.user.id. */
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const result = await query(
        `SELECT id, email, username, display_name AS "displayName", avatar_url AS "avatarUrl", created_at AS "createdAt"
         FROM users WHERE id = $1`,
        [userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ user: result.rows[0] });
    } catch (err) {
      console.error('[auth.me] error', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new AuthController();
