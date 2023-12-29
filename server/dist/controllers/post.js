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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPost = exports.getRelevantTags = exports.getHotTags = exports.getAutoTags = exports.deletePost = exports.getPost = exports.getMotherAndReplies = exports.getPostsOnBoard = exports.getCustomizedPosts = exports.getRecommendPosts = exports.downvotePost = exports.upvotePost = exports.likePost = exports.commentPost = exports.editPost = exports.createPost = void 0;
const mongodb_1 = require("mongodb");
const post_1 = __importStar(require("../models/post")), postModel = post_1;
const userModel = __importStar(require("../models/user"));
const tagModel = __importStar(require("../models/tag"));
const socket_1 = require("./socket");
const errorHandler_1 = require("../utils/errorHandler");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
exports.createPost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { category, user, title, content, board, motherPost } = req.body;
    const tags = req.body.tags;
    if (!['native', 'mother', 'reply'].includes(category)) {
        throw new errorHandler_1.ValidationError('The category should either be native, mother or reply');
    }
    if (!content) {
        throw new errorHandler_1.ValidationError('A post needs to have content');
    }
    const userId = new mongodb_1.ObjectId(user);
    const publishDate = new Date();
    let postData;
    let tagsArray = [];
    if (category === 'reply') {
        const motherPostInfo = yield post_1.default.findOne({ _id: motherPost });
        if (!motherPostInfo) {
            throw new errorHandler_1.ValidationError('mother post does not exist');
        }
        yield postModel.changeMotherPostLastUpdateTime(motherPost, publishDate, userId);
        tagsArray = motherPostInfo.tags;
        const postBoard = motherPostInfo.board;
        postData = yield post_1.default.create({
            category,
            author: userId,
            content,
            publish_date: publishDate,
            update_date: publishDate,
            tags: tagsArray,
            board: postBoard,
            mother_post: motherPost,
        });
        if (motherPostInfo.author.toString() !== userId.toString()) {
            userModel.addNotification(motherPostInfo.author, 'reply_post', userId, postData._id);
            (0, socket_1.sendNotificationThroughSocket)(motherPostInfo.author.toString(), 'reply_post', '有人回覆了你的貼文', userId.toString(), postData._id.toString());
        }
    }
    if (category === 'native') {
        if (!tags) {
            throw new errorHandler_1.ValidationError('A native post should have tag');
        }
        tagsArray = Array.isArray(tags)
            ? tags.map((tag) => tag.toLowerCase())
            : [tags.toLowerCase()].filter(Boolean);
        postData = yield post_1.default.create({
            category,
            author: userId,
            content,
            publish_date: publishDate,
            update_date: publishDate,
            tags: tagsArray,
        });
    }
    if (category === 'mother') {
        if (!title) {
            throw new errorHandler_1.ValidationError('A mother post should have title');
        }
        if (!board) {
            throw new errorHandler_1.ValidationError('A mother post should have a board');
        }
        if (!tags) {
            throw new errorHandler_1.ValidationError('A mother post should have tag');
        }
        tagsArray = Array.isArray(tags)
            ? tags.map((tag) => tag.toLowerCase())
            : [tags.toLowerCase()].filter(Boolean);
        postData = yield post_1.default.create({
            category,
            author: userId,
            title,
            content,
            publish_date: publishDate,
            update_date: publishDate,
            tags: tagsArray,
            board,
        });
    }
    try {
        tagModel.addPostTagsToDB(tagsArray);
    }
    catch (err) {
        console.log(err);
        console.log('something goes wrong adding post tags to DB');
    }
    res.json({
        postData,
    });
}));
exports.editPost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, post } = req.body;
    if (!content) {
        throw new errorHandler_1.ValidationError('edit must have content');
    }
    if (!post) {
        throw new errorHandler_1.ValidationError('edit must have post id');
    }
    yield postModel.updatePost(post, content);
    res.json({ message: 'update success' });
}));
exports.commentPost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    const { content, user } = req.body;
    const userId = new mongodb_1.ObjectId(user);
    const publishDate = new Date();
    const commentTarget = yield post_1.default.findOne({ _id: postId });
    if (commentTarget === null) {
        throw new errorHandler_1.ValidationError('Comment post does not exist');
    }
    const postCategory = commentTarget.category;
    let motherPost;
    if (commentTarget.mother_post) {
        motherPost = commentTarget.mother_post.toString();
    }
    userModel.updateUserAction(userId, commentTarget.tags, commentTarget.board);
    yield postModel.commentPost(postId, userId, content, publishDate);
    if (postCategory === 'reply') {
        if (!motherPost) {
            throw new errorHandler_1.ValidationError('reply post must have mother post id');
        }
        yield postModel.calculateMotherPostHot(motherPost, 'comment', true);
    }
    if (commentTarget.author.toString() !== userId.toString()) {
        userModel.addNotification(commentTarget.author, 'comment_post', userId, commentTarget._id);
        (0, socket_1.sendNotificationThroughSocket)(commentTarget.author.toString(), 'comment_post', '有人在你的貼文留言', userId.toString(), commentTarget._id.toString());
    }
    res.json({ message: 'Add comment success' });
}));
exports.likePost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { postId } = req.params;
    const { user, like } = req.body;
    const userId = new mongodb_1.ObjectId(user);
    if (![true, false].includes(like)) {
        throw new errorHandler_1.ValidationError('like should be either true or false');
    }
    const likeTarget = yield post_1.default.findOne({ _id: postId });
    if (likeTarget === null)
        throw Error('like target post does not exist');
    if (likeTarget.category !== 'native')
        throw Error('target not native');
    const ifAlreadyLike = (_b = (_a = likeTarget.liked) === null || _a === void 0 ? void 0 : _a.users) === null || _b === void 0 ? void 0 : _b.includes(userId);
    if (like && ifAlreadyLike)
        throw Error('user already liked the post');
    if (!like && !ifAlreadyLike)
        throw Error('user did not like the post');
    yield postModel.handlelikePost(userId, postId, like);
    userModel.updateUserAction(userId, likeTarget.tags, likeTarget.board);
    if (likeTarget.author.toString() !== userId.toString() && like === true) {
        userModel.addNotification(likeTarget.author, 'like_post', userId, likeTarget._id);
        (0, socket_1.sendNotificationThroughSocket)(likeTarget.author.toString(), 'like_post', '有人喜歡你的貼文', userId.toString(), likeTarget._id.toString());
    }
    res.json({ message: `like post success: ${like}` });
}));
exports.upvotePost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const { postId } = req.params;
    const { user, upvote } = req.body;
    const userId = new mongodb_1.ObjectId(user);
    if (![true, false].includes(upvote)) {
        throw new errorHandler_1.ValidationError('upvote should be either true or false');
    }
    const upvoteTarget = yield post_1.default.findOne({ _id: postId });
    if (upvoteTarget === null)
        throw Error('upvote target post does not exist');
    userModel.updateUserAction(userId, upvoteTarget.tags, upvoteTarget.board);
    const ifAlreadyUpvote = upvoteTarget.upvote.users.includes(userId);
    const ifAlreadyDownVote = upvoteTarget.downvote.users.includes(userId);
    if (upvote && ifAlreadyUpvote)
        throw Error('user already upvoted the post');
    if (!upvote && !ifAlreadyUpvote)
        throw Error('user not upvote the post');
    const motherPost = (_c = upvoteTarget.mother_post) === null || _c === void 0 ? void 0 : _c.toString();
    yield postModel.handleVotePost(userId, upvoteTarget._id, true, upvote, upvoteTarget.category, ifAlreadyDownVote, motherPost);
    if (upvoteTarget.author.toString() !== userId.toString()) {
        userModel.addNotification(upvoteTarget.author, 'upvote_post', userId, upvoteTarget._id);
        (0, socket_1.sendNotificationThroughSocket)(upvoteTarget.author.toString(), 'upvote_post', '有人覺得你的貼文有用', userId.toString(), upvoteTarget._id.toString());
    }
    res.json({ message: `upvote post success ${upvote}` });
}));
exports.downvotePost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const { postId } = req.params;
    const { user, downvote } = req.body;
    const userId = new mongodb_1.ObjectId(user);
    if (![true, false].includes(downvote)) {
        throw new errorHandler_1.ValidationError('upvote should be either true or false');
    }
    const downvoteTarget = yield post_1.default.findOne({ _id: postId });
    if (downvoteTarget === null)
        throw Error('target post does not exist');
    userModel.updateUserAction(userId, downvoteTarget.tags, downvoteTarget.board);
    const ifAlreadyUpvote = downvoteTarget.upvote.users.includes(userId);
    const ifAlreadyDownVote = downvoteTarget.downvote.users.includes(userId);
    if (downvote && ifAlreadyDownVote)
        throw Error('already downvoted');
    if (!downvote && !ifAlreadyDownVote)
        throw Error('not downvoted the post');
    const motherPost = (_d = downvoteTarget.mother_post) === null || _d === void 0 ? void 0 : _d.toString();
    yield postModel.handleVotePost(userId, downvoteTarget._id, false, downvote, downvoteTarget.category, ifAlreadyUpvote, motherPost);
    res.json({ message: `downvote post success ${downvote}` });
}));
exports.getRecommendPosts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.body;
    const userId = new mongodb_1.ObjectId(user);
    const userInfo = (yield userModel.getUserPreference(userId));
    let preferenceTags;
    if (userInfo) {
        preferenceTags = userInfo.preference_tags.map((tag) => tag.name);
    }
    else {
        throw new errorHandler_1.ValidationError('No such user, something wrong getting tags');
    }
    const posts = yield postModel.getRecommendedPosts(preferenceTags, userInfo.read_posts, 'auto', undefined);
    res.json(posts);
}));
exports.getCustomizedPosts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.body;
    const tags = req.query.tags;
    if (!tags) {
        throw new errorHandler_1.ValidationError('No tags');
    }
    const userInfo = (yield userModel.getUserPreference(user));
    let tagsArray = [];
    if (tags !== undefined) {
        tagsArray = Array.isArray(tags) ? tags : [tags].filter(Boolean);
    }
    const preferenceTags = userInfo.preference_tags.map((tag) => tag.name);
    const posts = yield postModel.getRecommendedPosts(preferenceTags, userInfo.read_posts, 'customized', tagsArray);
    res.json(posts);
}));
exports.getPostsOnBoard = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { boardId } = req.params;
    let paging;
    if (req.query.paging && !Number.isNaN(req.query.paging)) {
        paging = +req.query.paging;
    }
    else if (Number.isNaN(req.query.paging)) {
        throw new errorHandler_1.ValidationError('paging must be type number');
    }
    else {
        paging = 0;
    }
    const result = yield postModel.getBoardPosts(boardId, paging);
    res.json({ posts: result.posts, nextPage: result.nextPage });
}));
exports.getMotherAndReplies = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const motherPost = req.query.id;
    if (!motherPost || typeof motherPost !== 'string') {
        throw new errorHandler_1.ValidationError('There should be mother post id');
    }
    const motherPostInfo = yield post_1.default.findOne({ _id: motherPost });
    if (!motherPostInfo) {
        res.status(400).json({ error: 'Mother post does not exist' });
        return;
    }
    if (motherPostInfo.is_delete === true) {
        res.status(404).json({ error: 'Mother post was deleted' });
        return;
    }
    let paging;
    if (req.query.paging && !Number.isNaN(req.query.paging)) {
        paging = +req.query.paging;
    }
    else if (Number.isNaN(req.query.paging)) {
        throw new errorHandler_1.ValidationError('paging must be type number');
    }
    else {
        paging = 0;
    }
    const motherPostId = new mongodb_1.ObjectId(motherPost);
    const postsInfo = yield postModel.getMotherAndReplyPosts(motherPostId, paging);
    postsInfo.posts = postsInfo.posts.filter((post) => post.is_delete === false);
    res.json(postsInfo);
}));
exports.getPost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    if (!id) {
        res.status(400).json({ error: 'post id should be in req body' });
        return;
    }
    const postInfo = yield postModel.getPost(id);
    if (!postInfo) {
        res.status(400).json({ error: 'post does not exist' });
        return;
    }
    if (postInfo.is_delete === true) {
        res
            .status(404)
            .json({ status: 'deleted', message: 'the post was deleted' });
        return;
    }
    res.json(postInfo);
}));
exports.deletePost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.body;
    const { id } = req.query;
    if (!id) {
        res.status(400).json({ error: 'post id should be in query' });
        return;
    }
    const targetPost = yield post_1.default.findOne({ _id: id });
    if (!targetPost) {
        res.status(400).json({ error: 'target post does not exist' });
        return;
    }
    if (targetPost.author.toString() !== user) {
        res
            .status(403)
            .json({ message: 'user is not author, can not delete the post' });
        return;
    }
    yield post_1.default.updateOne({ _id: id }, { $set: { is_delete: true } });
    res.json({ message: 'post deleted' });
}));
exports.getAutoTags = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    if (!search) {
        res.status(400).json({ error: 'search missing' });
        return;
    }
    if (typeof search !== 'string') {
        res.status(400).json({ error: 'search invalid' });
        return;
    }
    const tags = yield tagModel.getAutoCompleteTags(search);
    res.json(tags);
}));
exports.getHotTags = (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tags = yield tagModel.getHotTagsFromDB();
    res.json(tags);
}));
exports.getRelevantTags = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tag } = req.query;
    if (!tag) {
        res.status(400).json({ error: 'tag undefined' });
        return;
    }
    if (typeof tag !== 'string') {
        res.status(400).json({ error: 'tag is not string' });
        return;
    }
    const tags = yield tagModel.getRelevantTagsFromDB(tag);
    if (tags === 'error') {
        res.status(400).json({ error: 'tag not found' });
        return;
    }
    const obj = new Map();
    const returnArray = [];
    tags.forEach((eachTag) => {
        if (!obj.get(eachTag)) {
            obj.set(eachTag, 1);
        }
        else if (obj.get(eachTag) === 1) {
            returnArray.push(eachTag);
            obj.set(eachTag, 2);
        }
    });
    res.json(returnArray);
}));
exports.searchPost = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.query.should && !req.query.must) {
        res.status(400).json({ error: 'search missing' });
        return;
    }
    let paging;
    if (req.query.paging && !Number.isNaN(req.query.paging)) {
        paging = +req.query.paging;
    }
    else if (Number.isNaN(req.query.paging)) {
        throw new errorHandler_1.ValidationError('paging must be type number');
    }
    else {
        paging = 0;
    }
    const should = req.query.should;
    const must = req.query.must;
    const tags = req.query.tags;
    let shouldArray = [];
    if (should !== undefined) {
        shouldArray = Array.isArray(should) ? should : [should].filter(Boolean);
    }
    let mustArray = [];
    if (must !== undefined) {
        mustArray = Array.isArray(must) ? must : [must].filter(Boolean);
    }
    let tagArray = [];
    if (tags !== undefined) {
        tagArray = Array.isArray(tags) ? tags : [tags].filter(Boolean);
    }
    if (!shouldArray.every((item) => typeof item === 'string') ||
        !mustArray.every((item) => typeof item === 'string') ||
        !tagArray.every((item) => typeof item === 'string')) {
        res.status(400).json({
            error: '"should" and "must" "tags" must be strings or arrays of strings',
        });
        return;
    }
    const result = yield postModel.searchPosts(mustArray, shouldArray, tagArray, paging);
    res.json({ posts: result.posts, nextPage: result.ifNextPage });
}));
