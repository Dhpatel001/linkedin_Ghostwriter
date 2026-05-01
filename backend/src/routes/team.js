const router = require('express').Router();
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { checkSubscription, requirePlan } = require('../middleware/checkSubscription');
const { validateRequest } = require('../middleware/validateRequest');
const {
  getWorkspace,
  createWorkspace,
  inviteMember,
  updateMember,
  removeMember,
} = require('../controllers/teamController');

router.get('/workspace', authenticate, checkSubscription, requirePlan('scale'), getWorkspace);
router.post(
  '/workspace',
  authenticate,
  checkSubscription,
  requirePlan('scale'),
  [body('name').isString().isLength({ min: 2, max: 120 }), validateRequest],
  createWorkspace
);
router.post(
  '/workspace/invite',
  authenticate,
  checkSubscription,
  requirePlan('scale'),
  [
    body('email').isEmail(),
    body('role').optional().isIn(['editor', 'viewer']),
    validateRequest,
  ],
  inviteMember
);
router.patch(
  '/workspace/member/:email',
  authenticate,
  checkSubscription,
  requirePlan('scale'),
  [
    param('email').isEmail(),
    body('role').isIn(['editor', 'viewer']),
    validateRequest,
  ],
  updateMember
);
router.delete(
  '/workspace/member/:email',
  authenticate,
  checkSubscription,
  requirePlan('scale'),
  [param('email').isEmail(), validateRequest],
  removeMember
);

module.exports = router;
