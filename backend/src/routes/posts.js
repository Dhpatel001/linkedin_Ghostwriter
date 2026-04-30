const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
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

router.get('/', authenticate, getPosts);
router.post('/', authenticate, createPost);
router.post('/generate', authenticate, generatePost);
router.patch('/:id', authenticate, updatePost);
router.patch('/:id/approve', authenticate, approvePost);
router.patch('/:id/discard', authenticate, discardPost);
router.patch('/:id/edit', authenticate, editPost);
router.patch('/:id/posted', authenticate, markPosted);
router.patch('/:id/performance', authenticate, savePerformance);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/publish', authenticate, publishPost);

module.exports = router;
