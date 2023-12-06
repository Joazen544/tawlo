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
exports.getMotherAndReplyPostsFromDB = exports.getBoardPostsFromDB = exports.getAutoRecommendedPosts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const MOTHER_POST_PER_PAGE = 20;
const REPLY_POST_PER_PAGE = 10;
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
        //
        // read_posts.forEach(post=>{
        //   aggregateArray.push({
        //     $set: {
        //       score: {
        //         $cond: [
        //           {
        //             $in: [post, '$tags'],
        //           },
        //           {
        //             $add: ['$score', -50],
        //           },
        //           {
        //             $add: ['$score', 0],
        //           },
        //         ],
        //       },
        //     },
        //   });
        // })
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
                                        -200,
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
                            ],
                        },
                        {
                            $add: ['$score', 0],
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
exports.default = Post;
