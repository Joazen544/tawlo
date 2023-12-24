import { Router } from 'express';
import * as postControl from '../controllers/post';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/post').post(verifyJWT, postControl.createPost);
router.route('/post').get(postControl.getPost);
router.route('/post').delete(verifyJWT, postControl.deletePost);

router.route('/post/search').get(postControl.searchPost);

router
  .route('/posts/recommendation')
  .get(verifyJWT, postControl.getRecommendPosts);
router.route('/posts/customize').get(verifyJWT, postControl.getCustomizedPosts);
router.route('/board/:boardId/posts').get(postControl.getPostsOnBoard);

router.route('/board/post/detail').get(postControl.getMotherAndReplies);
router.route('/post/:postId/comment').post(verifyJWT, postControl.commentPost);
router.route('/post/:postId/like').post(verifyJWT, postControl.likePost);
router.route('/post/:postId/upvote').post(verifyJWT, postControl.upvotePost);
router
  .route('/post/:postId/downvote')
  .post(verifyJWT, postControl.downvotePost);

router.route('/post/tags/auto').get(postControl.getAutoTags);
router.route('/post/tags/relevant').get(postControl.getRelevantTags);
router.route('/post/tags/hot').get(postControl.getHotTags);

export default router;
