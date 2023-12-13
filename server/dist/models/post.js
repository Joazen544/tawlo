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
exports.searchPostsFromDB = exports.getPostFromDB = exports.getMotherAndReplyPostsFromDB = exports.getBoardPostsFromDB = exports.getAutoRecommendedPosts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const MOTHER_POST_PER_PAGE = 20;
const REPLY_POST_PER_PAGE = 10;
const SEARCH_POST_PER_PAGE = 20;
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
    // 3 tags the most
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
    // userId
    last_reply: mongodb_1.ObjectId,
    //
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
function getAutoRecommendedPosts(preferenceTags, boards, read_posts) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!boards)
            console.log(boards);
        const aggregateArray = [];
        aggregateArray.push({
            $match: {
                is_delete: false,
            },
        }, {
            $match: {
                $or: [
                    {
                        category: 'mother',
                    },
                    {
                        category: 'native',
                    },
                ],
            },
        }, {
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
        let scoring = 100;
        preferenceTags.forEach((tag) => {
            aggregateArray.push({
                $set: {
                    score: {
                        $cond: [
                            {
                                $in: [tag, '$tags'],
                            },
                            {
                                $add: ['$score', scoring * 5],
                            },
                            {
                                $add: ['$score', 0],
                            },
                        ],
                    },
                },
            });
            scoring -= 10;
        });
        aggregateArray.push({
            $set: {
                score: {
                    $cond: [
                        { $in: ['$_id', read_posts] },
                        {
                            $add: [
                                '$score',
                                {
                                    $multiply: [
                                        -300,
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
                                {
                                    $multiply: [
                                        200,
                                        {
                                            $dateDiff: {
                                                startDate: '$$NOW',
                                                endDate: '$update_date',
                                                unit: 'day',
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            $add: [
                                '$score',
                                {
                                    $multiply: [
                                        200,
                                        {
                                            $dateDiff: {
                                                startDate: '$$NOW',
                                                endDate: '$update_date',
                                                unit: 'day',
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        }, {
            $sort: {
                score: -1,
            },
        }, {
            $limit: 50,
        }, {
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
        // @ts-ignore
        const posts = yield Post.aggregate(aggregateArray);
        return posts;
    });
}
exports.getAutoRecommendedPosts = getAutoRecommendedPosts;
function getBoardPostsFromDB(boardId, paging) {
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
exports.getBoardPostsFromDB = getBoardPostsFromDB;
function getMotherAndReplyPostsFromDB(motherPostId, paging) {
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
exports.getMotherAndReplyPostsFromDB = getMotherAndReplyPostsFromDB;
function getPostFromDB(post) {
    return __awaiter(this, void 0, void 0, function* () {
        const postInfo = yield Post.findOne({ _id: post });
        return postInfo;
    });
}
exports.getPostFromDB = getPostFromDB;
function searchPostsFromDB(mustArray, shouldArray, tagArray, paging) {
    return __awaiter(this, void 0, void 0, function* () {
        const postTitleShouldArray = [];
        const postContentMustArray = [];
        const postContentShouldArray = [];
        const tagShouldArray = [];
        mustArray.forEach((must) => {
            postContentMustArray.push({
                phrase: {
                    query: `${must}`,
                    path: 'content',
                },
            });
            postTitleShouldArray.push({
                phrase: {
                    query: `${must}`,
                    path: 'title',
                },
            });
        });
        shouldArray.forEach((should) => {
            postContentShouldArray.push({
                phrase: {
                    query: `${should}`,
                    path: 'content',
                },
            });
            postTitleShouldArray.push({
                phrase: {
                    query: `${should}`,
                    path: 'title',
                },
            });
        });
        const shouldAllArray = [
            ...postTitleShouldArray,
            ...postContentShouldArray,
            ...postTitleShouldArray,
        ];
        tagArray.forEach((tag) => {
            tagShouldArray.push({
                phrase: {
                    query: `${tag}`,
                    path: 'tags',
                },
            });
        });
        const mustAllArray = [];
        if (tagShouldArray.length > 0) {
            mustAllArray.push({
                compound: {
                    should: tagShouldArray,
                },
            });
        }
        if (postContentMustArray.length > 0) {
            mustAllArray.push({
                compound: {
                    must: postContentMustArray,
                },
            });
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
            {
                $match: {
                    is_delete: false,
                    category: { $ne: 'reply' },
                },
            },
            {
                $skip: SEARCH_POST_PER_PAGE * paging,
            },
            {
                $limit: SEARCH_POST_PER_PAGE + 1,
            },
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
exports.searchPostsFromDB = searchPostsFromDB;
exports.default = Post;
