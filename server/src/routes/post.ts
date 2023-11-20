import { Router } from 'express';
import {
  createPost,
  commentPost,
  likeComment,
  likePost,
} from '../controllers/post';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/post').post(verifyJWT, createPost);
router.route('/post/:postId/comment').post(verifyJWT, commentPost);
router.route('/post/:postId/comment/like').post(verifyJWT, likeComment);
router.route('/post/:postId/like').post(verifyJWT, likePost);

export default router;
