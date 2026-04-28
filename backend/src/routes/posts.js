const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  publishPost,
} = require('../controllers/postsController');

router.get('/',         authenticate, getPosts);
router.post('/',        authenticate, createPost);
router.patch('/:id',    authenticate, updatePost);
router.delete('/:id',   authenticate, deletePost);
router.post('/:id/publish', authenticate, publishPost);

module.exports = router;
