const { authenticate } = require('./auth');

const requireAuth = authenticate;

module.exports = { requireAuth };
