"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_1 = require("../controllers/post");
const verifyJWT_1 = __importDefault(require("../middleware/verifyJWT"));
const router = (0, express_1.Router)();
router.route('/post').post(verifyJWT_1.default, post_1.createPost);
router.route('/post').get(post_1.getPost);
router.route('/post').delete(verifyJWT_1.default, post_1.deletePost);
router.route('/post/search').get(post_1.searchPost);
router.route('/posts/recommendation').get(verifyJWT_1.default, post_1.getRecommendPosts);
router.route('/posts/customize').get(verifyJWT_1.default, post_1.getCustomizedPosts);
// to get all the posts on a board
router.route('/board/:boardId/posts').get(post_1.getPostsOnBoard);
router.route('/board/post/detail').get(post_1.getMotherAndReplies);
router.route('/post/:postId/comment').post(verifyJWT_1.default, post_1.commentPost);
router.route('/post/:postId/comment/like').post(verifyJWT_1.default, post_1.likeComment);
router.route('/post/:postId/like').post(verifyJWT_1.default, post_1.likePost);
router.route('/post/:postId/upvote').post(verifyJWT_1.default, post_1.upvotePost);
router.route('/post/:postId/downvote').post(verifyJWT_1.default, post_1.downvotePost);
router.route('/post/tags/auto').get(post_1.getAutoTags);
router.route('/post/tags/relevant').get(post_1.getRelevantTags);
router.route('/post/tags/hot').get(post_1.getHotTags);
exports.default = router;
