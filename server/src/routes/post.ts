import { Router } from 'express';
import {
  createPost,
  commentPost,
  likeComment,
  likePost,
  upvotePost,
  downvotePost,
  getRecommendPosts,
  getPostsOnBoard,
  getMotherAndReplies,
  getPost,
  deletePost,
  getTags,
} from '../controllers/post';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/post').post(verifyJWT, createPost);
router.route('/post').get(getPost);
router.route('/post').delete(verifyJWT, deletePost);
router.route('/posts/recommendation').get(verifyJWT, getRecommendPosts);
// to get all the posts on a board
router.route('/board/:boardId/posts').get(getPostsOnBoard);
router.route('/board/post/detail').get(getMotherAndReplies);
router.route('/post/:postId/comment').post(verifyJWT, commentPost);
router.route('/post/:postId/comment/like').post(verifyJWT, likeComment);
router.route('/post/:postId/like').post(verifyJWT, likePost);
router.route('/post/:postId/upvote').post(verifyJWT, upvotePost);
router.route('/post/:postId/downvote').post(verifyJWT, downvotePost);
router.route('/post/tags').get(getTags);

export default router;
