const { authRequired, signToken, verifyToken } = require('./auth');

// This file will export middleware as the application grows
module.exports = {
  authRequired,
  signToken,
  verifyToken,
};
