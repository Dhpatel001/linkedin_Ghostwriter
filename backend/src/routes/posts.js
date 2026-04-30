const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { buildRateLimiter } = require('../middleware/rateLimiter');
const { checkSubscription } = require('../middleware/checkSubscription');
const { validateRequest } = require('../middleware/validateRequest');
const {
  getPosts,
  createPost,
  generatePost,
  updatePost,
  deletePost,
  approvePost,
  discardPost,
  editPost,
  markPosted,
  savePerformance,
  publishPost,
} = require('../controllers/postsController');

const generationRateLimit = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Post generation rate limit reached. Please try again later.',
});
const mutationRateLimit = buildRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 120,
});

const postIdValidation = [param('id').isMongoId(), validateRequest];

router.get(
  '/',
  authenticate,
  [query('status').optional().isIn(['pending', 'approved', 'discarded', 'posted']), validateRequest],
  getPosts
);
router.post(
  '/',
  authenticate,
  checkSubscription,
  mutationRateLimit,
  [body('content').isString().isLength({ min: 1, max: 10000 }), body('topic').optional().isString().isLength({ min: 1, max: 120 }), validateRequest],
  createPost
);
router.post(
  '/generate',
  authenticate,
  checkSubscription,
  generationRateLimit,
  [body('topic').isString().isLength({ min: 1, max: 120 }), body('tone').optional().isString(), body('length').optional().isString(), body('keywords').optional().isArray({ max: 20 }), validateRequest],
  generatePost
);
router.patch('/:id', authenticate, checkSubscription, mutationRateLimit, postIdValidation, updatePost);
router.patch(
  '/:id/approve',
  authenticate,
  checkSubscription,
  mutationRateLimit,
  [...postIdValidation, body('voiceScore').optional().isFloat({ min: 1, max: 10 }), validateRequest],
  approvePost
);
router.patch('/:id/discard', authenticate, checkSubscription, mutationRateLimit, postIdValidation, discardPost);
router.patch(
  '/:id/edit',
  authenticate,
  checkSubscription,
  mutationRateLimit,
  [...postIdValidation, body('editedContent').isString().isLength({ min: 1, max: 10000 }), validateRequest],
  editPost
);
router.patch('/:id/posted', authenticate, checkSubscription, mutationRateLimit, postIdValidation, markPosted);
router.patch('/:id/performance', authenticate, checkSubscription, mutationRateLimit, postIdValidation, savePerformance);
router.delete('/:id', authenticate, checkSubscription, mutationRateLimit, postIdValidation, deletePost);
router.post('/:id/publish', authenticate, checkSubscription, mutationRateLimit, postIdValidation, publishPost);

module.exports = router;
