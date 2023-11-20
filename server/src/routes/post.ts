import { Router } from 'express';
import {
  createPost,
  commentPost,
  likeComment,
  likePost,
  upvotePost,
  downvotePost,
} from '../controllers/post';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/post').post(verifyJWT, createPost);
router.route('/post/:postId/comment').post(verifyJWT, commentPost);
router.route('/post/:postId/comment/like').post(verifyJWT, likeComment);
router.route('/post/:postId/like').post(verifyJWT, likePost);
router.route('/post/:postId/upvote').post(verifyJWT, upvotePost);
router.route('/post/:postId/downvote').post(verifyJWT, downvotePost);

export default router;
