"use strict";
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
exports.handleVotePost = exports.handlelikePost = exports.commentPost = exports.changeMotherPostLastUpdateTime = exports.calculateMotherPostHot = exports.updatePost = exports.searchPosts = exports.getPost = exports.getMotherAndReplyPosts = exports.getBoardPosts = exports.getRecommendedPosts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const MOTHER_POST_PER_PAGE = 20;
const REPLY_POST_PER_PAGE = 10;
const RECOMMENDATION_POSTS_PER_CALCULATE = 50;
const SEARCH_POST_PER_PAGE = 20;
const LIKE_COMMENT_UPVOTE_HOT_SCORE = 100;
const CALCULATE_POST_HOT_QUERY = {
    $set: {
        hot: {
            $multiply: [
                LIKE_COMMENT_UPVOTE_HOT_SCORE,
                { $add: ['$sum_likes', '$sum_upvotes', '$sum_comments', 1] },
            ],
        },
    },
};
const postSchema = new mongoose_1.default.Schema({
    is_delete: {
        type: Boolean,
        default: false,
        required: true,
    },
    category: {
        // native || mother || reply
        type: String,
        enum: ['native', 'mother', 'reply'],
        required: true,
    },
    title: String,
    publish_date: {
        type: Date,
        required: true,
    },
    update_date: { type: Date, required: true },
    author: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    edit: [
        {
            date: Date,
            content: String,
        },
    ],
    board: mongodb_1.ObjectId,
    mother_post: mongodb_1.ObjectId,
    // 4 tags the most
    tags: {
        type: [String],
        required: [true, 'A post must contain a tag'],
    },
    liked: {
        number: { type: Number, default: 0 },
        users: { type: [mongodb_1.ObjectId], default: [] },
    },
    // only on mother post
    sum_likes: { type: Number, default: 0 },
    sum_upvotes: { type: Number, default: 0 },
    sum_comments: { type: Number, default: 0 },
    sum_reply: { type: Number, default: 0 },
    last_reply: mongodb_1.ObjectId,
    upvote: {
        number: { type: Number, default: 0 },
        users: { type: [mongodb_1.ObjectId], default: [] },
    },
    downvote: {
        number: { type: Number, default: 0 },
        users: { type: [mongodb_1.ObjectId], default: [] },
    },
    useful: Number,
    comments: {
        number: { type: Number, default: 0 },
        data: [
            {
                user: mongodb_1.ObjectId,
                content: String,
                time: Date,
                like: {
                    number: Number,
                    users: [mongodb_1.ObjectId],
                },
            },
        ],
    },
    hot: { type: Number, default: 0 },
});
const Post = mongoose_1.default.model('Post', postSchema);
function getRecommendedPosts(preferenceTags, read_posts, category, tags) {
    return __awaiter(this, void 0, void 0, function* () {
        const TIME_SCORE = 50;
        const READ_POST_MINUS = -500;
        const CALCULATE_TIME_SCORE_QUERY = {
            $multiply: [
                TIME_SCORE,
                {
                    $dateDiff: {
                        startDate: '$$NOW',
                        endDate: '$update_date',
                        unit: 'day',
                    },
                },
            ],
        };
        const RECOMMENDATION_TAG_MAX_SCORE = 100;
        const RECOMMENDATION_TAG_EACH_MULTIPLE_SCORE = 20;
        const RECOMMENDATION_TAG_EACH_REDUCE_SCORE = 10;
        const aggregateArray = [];
        aggregateArray.push({ $match: { is_delete: false } }, { $match: { $or: [{ category: 'mother' }, { category: 'native' }] } });
        if (category === 'customized') {
            if (!tags || tags.length === 0) {
                throw new Error('customized recommendation should have tags');
            }
            aggregateArray.push({ $match: { tags: { $in: tags } } });
        }
        aggregateArray.push({
            $addFields: {
                score: 0,
                time: {
                    $dateDiff: {
                        startDate: '$$NOW',
                        endDate: '$publish_date',
                        unit: 'hour',
                    },
                },
            },
        });
        let scoring = RECOMMENDATION_TAG_MAX_SCORE;
        preferenceTags.forEach((tag) => {
            aggregateArray.push({
                $set: {
                    score: {
                        $cond: [
                            { $in: [tag, '$tags'] },
                            {
                                $add: [
                                    '$score',
                                    scoring * RECOMMENDATION_TAG_EACH_MULTIPLE_SCORE,
                                ],
                            },
                            { $add: ['$score', 0] },
                        ],
                    },
                },
            });
            scoring -= RECOMMENDATION_TAG_EACH_REDUCE_SCORE;
        });
        aggregateArray.push({
            $set: {
                score: {
                    $cond: [
                        { $in: ['$_id', read_posts] },
                        {
                            $add: [
                                '$score',
                                '$hot',
                                {
                                    $multiply: [
                                        READ_POST_MINUS,
                                        {
                                            $size: {
                                                $filter: {
                                                    input: read_posts,
                                                    as: 'post',
                                                    cond: { $eq: ['$$post', '$_id'] },
                                                },
                                            },
                                        },
                                    ],
                                },
                                CALCULATE_TIME_SCORE_QUERY,
                            ],
                        },
                        {
                            $add: ['$score', '$hot', CALCULATE_TIME_SCORE_QUERY],
                        },
                    ],
                },
            },
        }, { $sort: { score: -1 } }, { $limit: RECOMMENDATION_POSTS_PER_CALCULATE }, {
            $project: {
                _id: 1,
                category: 1,
                board: 1,
                hot: 1,
                score: 1,
                tags: 1,
                time: 1,
                title: 1,
                author: 1,
                publish_date: 1,
                update_date: 1,
                content: 1,
                edit: 1,
                liked: 1,
                sum_likes: 1,
                sum_upvotes: 1,
                sum_comments: 1,
                sum_reply: 1,
                last_reply: 1,
                upvote: 1,
                downvote: 1,
                comments: 1,
            },
        });
        const posts = yield Post.aggregate(aggregateArray);
        return posts;
    });
}
exports.getRecommendedPosts = getRecommendedPosts;
function getBoardPosts(boardId, paging) {
    return __awaiter(this, void 0, void 0, function* () {
        const board = new mongodb_1.ObjectId(boardId);
        const postsOnBoard = yield Post.find({
            category: 'mother',
            board,
            is_delete: false,
        })
            .sort({ update_date: -1 })
            .skip(paging * MOTHER_POST_PER_PAGE)
            .limit(MOTHER_POST_PER_PAGE + 1);
        let nextPage;
        if (postsOnBoard.length > MOTHER_POST_PER_PAGE) {
            nextPage = true;
        }
        else {
            nextPage = false;
        }
        const posts = postsOnBoard.slice(0, MOTHER_POST_PER_PAGE);
        return { posts, nextPage };
    });
}
exports.getBoardPosts = getBoardPosts;
function getMotherAndReplyPosts(motherPostId, paging) {
    return __awaiter(this, void 0, void 0, function* () {
        const replyPosts = yield Post.find({
            $or: [{ _id: motherPostId }, { mother_post: motherPostId }],
        })
            .sort({ _id: 1 })
            .skip(paging * REPLY_POST_PER_PAGE)
            .limit(REPLY_POST_PER_PAGE + 1);
        let nextPage;
        if (replyPosts.length > REPLY_POST_PER_PAGE) {
            nextPage = true;
        }
        else {
            nextPage = false;
        }
        const posts = replyPosts.slice(0, REPLY_POST_PER_PAGE);
        return { posts, nextPage };
    });
}
exports.getMotherAndReplyPosts = getMotherAndReplyPosts;
function getPost(post) {
    return __awaiter(this, void 0, void 0, function* () {
        const postInfo = yield Post.findOne({ _id: post });
        return postInfo;
    });
}
exports.getPost = getPost;
function searchPosts(mustArray, shouldArray, tagArray, paging) {
    return __awaiter(this, void 0, void 0, function* () {
        const postTitleShouldArray = [];
        const postContentMustArray = [];
        const postContentShouldArray = [];
        const tagShouldArray = [];
        mustArray.forEach((must) => {
            postContentMustArray.push({
                phrase: { query: `${must}`, path: 'content' },
            });
            postTitleShouldArray.push({
                phrase: { query: `${must}`, path: 'title' },
            });
        });
        shouldArray.forEach((should) => {
            postContentShouldArray.push({
                phrase: { query: `${should}`, path: 'content' },
            });
            postTitleShouldArray.push({
                phrase: { query: `${should}`, path: 'title' },
            });
        });
        const shouldAllArray = [
            ...postTitleShouldArray,
            ...postContentShouldArray,
            ...postTitleShouldArray,
        ];
        tagArray.forEach((tag) => {
            tagShouldArray.push({ phrase: { query: `${tag}`, path: 'tags' } });
        });
        const mustAllArray = [];
        if (tagShouldArray.length > 0) {
            mustAllArray.push({ compound: { should: tagShouldArray } });
        }
        if (postContentMustArray.length > 0) {
            mustAllArray.push({ compound: { must: postContentMustArray } });
        }
        const result = yield Post.aggregate([
            {
                $search: {
                    index: 'postSearch',
                    compound: {
                        must: mustAllArray,
                        should: shouldAllArray,
                        mustNot: [],
                    },
                },
            },
            { $match: { is_delete: false, category: { $ne: 'reply' } } },
            { $skip: SEARCH_POST_PER_PAGE * paging },
            { $limit: SEARCH_POST_PER_PAGE + 1 },
        ]);
        let ifNextPage = false;
        let returnPosts;
        if (result.length > SEARCH_POST_PER_PAGE) {
            // next page exist
            ifNextPage = true;
            returnPosts = result.slice(0, SEARCH_POST_PER_PAGE);
        }
        else {
            returnPosts = result;
        }
        return { posts: returnPosts, ifNextPage };
    });
}
exports.searchPosts = searchPosts;
function updatePost(post, content) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Post.updateOne({ _id: post }, { content });
    });
}
exports.updatePost = updatePost;
function calculateMotherPostHot(postId, increaseField, increase) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!['comment', 'like', 'upvote'].includes(increaseField)) {
            throw Error('the increase field sent to calculate hot function is wrong');
        }
        const field = `sum_${increaseField}s`; // 不過可能會要處理英文不規則變化? XD
        const num = increase === true ? 1 : -1;
        const calculateResult = yield Post.updateOne({ _id: postId }, [
            {
                $set: {
                    [field]: { $add: [`$${field}`, num] },
                },
            },
            CALCULATE_POST_HOT_QUERY,
        ]);
        if (calculateResult.modifiedCount !== 1) {
            throw Error('calculate hot fail');
        }
        return true;
    });
}
exports.calculateMotherPostHot = calculateMotherPostHot;
function changeMotherPostLastUpdateTime(motherPost, updateDate, lastReplier) {
    return __awaiter(this, void 0, void 0, function* () {
        const updateMotherResult = yield Post.updateOne({ _id: motherPost }, {
            $set: {
                update_date: updateDate,
                last_reply: lastReplier,
            },
            $inc: { sum_reply: 1 },
        });
        if (updateMotherResult.acknowledged === false) {
            throw new Error('mother post deoes not exist or something is wrong updating it');
        }
    });
}
exports.changeMotherPostLastUpdateTime = changeMotherPostLastUpdateTime;
function commentPost(postId, userId, content, publishDate) {
    return __awaiter(this, void 0, void 0, function* () {
        const commentResult = yield Post.updateOne({ _id: postId }, [
            {
                $set: {
                    'comments.data': {
                        $concatArrays: [
                            '$comments.data',
                            [
                                {
                                    user: userId,
                                    content,
                                    time: publishDate,
                                    like: { number: 0, users: [] },
                                },
                            ],
                        ],
                    },
                    'comments.number': { $add: ['$comments.number', 1] },
                    sum_comments: { $add: ['$sum_comments', 1] },
                },
            },
            CALCULATE_POST_HOT_QUERY,
        ]);
        if (commentResult.acknowledged === false) {
            throw new Error('Create comment fail');
        }
    });
}
exports.commentPost = commentPost;
function handlelikePost(userId, postId, like) {
    return __awaiter(this, void 0, void 0, function* () {
        const increment = like ? 1 : -1;
        let adjustUserArray;
        if (like) {
            adjustUserArray = {
                'liked.users': {
                    $concatArrays: ['$liked.users', [userId]],
                },
            };
        }
        else if (!like) {
            adjustUserArray = {
                'liked.users': {
                    $filter: {
                        input: '$liked.users',
                        as: 'user',
                        cond: { $ne: ['$$user', userId] },
                    },
                },
            };
        }
        const result = yield Post.updateOne({ _id: postId }, [
            { $set: { 'liked.number': { $add: ['$liked.number', increment] } } },
            { $set: adjustUserArray },
            { $set: { sum_likes: { $add: ['$sum_likes', increment] } } },
            CALCULATE_POST_HOT_QUERY,
        ]);
        if (result.acknowledged === false)
            throw Error('like a post fail');
    });
}
exports.handlelikePost = handlelikePost;
function handleVotePost(userId, postId, upOrDownVote, voteOrCancel, category, ifAlreadyOppositeVote, motherPost) {
    return __awaiter(this, void 0, void 0, function* () {
        const increment = voteOrCancel ? 1 : -1;
        let adjustUserArray;
        const USERS = upOrDownVote ? 'upvote.users' : 'downvote.users';
        const OPPOSITE_USERS = upOrDownVote ? 'downvote.users' : 'upvote.users';
        const NUMBER = upOrDownVote ? 'upvote.number' : 'downvote.number';
        const OPPOSITE_NUMBER = upOrDownVote ? 'downvote.number' : 'upvote.number';
        if (voteOrCancel) {
            adjustUserArray = {
                [USERS]: {
                    $concatArrays: [`$${USERS}`, [userId]],
                },
            };
        }
        else {
            adjustUserArray = {
                [USERS]: {
                    $filter: {
                        input: `$${USERS}`,
                        as: 'user',
                        cond: { $ne: ['$$user', userId] },
                    },
                },
            };
        }
        let sumIncrement = ifAlreadyOppositeVote ? increment * 2 : increment;
        sumIncrement = upOrDownVote ? sumIncrement : -sumIncrement;
        const aggregateArray = [
            { $set: { [NUMBER]: { $add: [`$${NUMBER}`, increment] } } },
            { $set: adjustUserArray },
        ];
        if (ifAlreadyOppositeVote && voteOrCancel) {
            aggregateArray.push({
                $set: { [OPPOSITE_NUMBER]: { $add: [`$${OPPOSITE_NUMBER}`, -1] } },
            });
            aggregateArray.push({
                $set: {
                    [OPPOSITE_USERS]: {
                        $filter: {
                            input: `$${OPPOSITE_USERS}`,
                            as: 'user',
                            cond: { $ne: ['$$user', userId] },
                        },
                    },
                },
            });
        }
        if (category === 'mother' || category === 'native') {
            aggregateArray.push({
                $set: { sum_upvotes: { $add: ['$sum_upvotes', sumIncrement] } },
            });
            aggregateArray.push(CALCULATE_POST_HOT_QUERY);
        }
        const result = yield Post.updateOne({ _id: postId }, aggregateArray);
        if (result.acknowledged === false) {
            throw Error(`upvote a post fail: ${voteOrCancel}`);
        }
        if (category === 'reply') {
            if (!motherPost) {
                throw new Error('no mother post id updating upvote');
            }
            const cancelDownVoteFromMotherResult = yield Post.updateOne({ _id: motherPost }, [
                { $set: { sum_upvotes: { $add: ['$sum_upvotes', sumIncrement] } } },
                CALCULATE_POST_HOT_QUERY,
            ]);
            if (cancelDownVoteFromMotherResult.acknowledged === false) {
                throw new Error('cancel downvote from mother fail');
            }
        }
    });
}
exports.handleVotePost = handleVotePost;
exports.default = Post;
