"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postControl = __importStar(require("../controllers/post"));
const verifyJWT_1 = __importDefault(require("../middleware/verifyJWT"));
const router = (0, express_1.Router)();
router.route('/post').post(verifyJWT_1.default, postControl.createPost);
router.route('/post').get(postControl.getPost);
router.route('/post').delete(verifyJWT_1.default, postControl.deletePost);
router.route('/post/search').get(postControl.searchPost);
router
    .route('/posts/recommendation')
    .get(verifyJWT_1.default, postControl.getRecommendPosts);
router.route('/posts/customize').get(verifyJWT_1.default, postControl.getCustomizedPosts);
router.route('/board/:boardId/posts').get(postControl.getPostsOnBoard);
router.route('/board/post/detail').get(postControl.getMotherAndReplies);
router.route('/post/:postId/comment').post(verifyJWT_1.default, postControl.commentPost);
router.route('/post/:postId/like').post(verifyJWT_1.default, postControl.likePost);
router.route('/post/:postId/upvote').post(verifyJWT_1.default, postControl.upvotePost);
router
    .route('/post/:postId/downvote')
    .post(verifyJWT_1.default, postControl.downvotePost);
router.route('/post/tags/auto').get(postControl.getAutoTags);
router.route('/post/tags/relevant').get(postControl.getRelevantTags);
router.route('/post/tags/hot').get(postControl.getHotTags);
exports.default = router;
