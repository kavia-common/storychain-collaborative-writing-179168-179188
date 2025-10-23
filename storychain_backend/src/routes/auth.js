const express = require('express');
const authController = require('../controllers/auth');
const { authRequired } = require('../middleware/auth');

/**
 * Auth-only router that mirrors the /auth endpoints defined in the main routes,
 * so it can be mounted under both '/auth' and '/api/auth' without duplicating
 * controller logic or Swagger docs.
 */
const authRouter = express.Router();

// POST /signup
authRouter.post('/signup', authController.signup.bind(authController));

// POST /login
authRouter.post('/login', authController.login.bind(authController));

// POST /logout
authRouter.post('/logout', authController.logout.bind(authController));

// GET /me
authRouter.get('/me', authRequired, authController.me.bind(authController));

module.exports = authRouter;
