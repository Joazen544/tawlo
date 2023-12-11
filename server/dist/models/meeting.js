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
exports.joinMeeting = exports.createMeeting = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const meetingSchema = new mongoose_1.default.Schema({
    status: {
        type: String,
        enum: ['pending', 'checking', 'end', 'fail'],
        default: 'pending',
        required: true,
    },
    users: {
        type: [mongodb_1.ObjectId],
        default: undefined,
        required: true,
    },
    ratings: {
        type: [Number],
        default: undefined,
        required: true,
    },
    meeting_comments: {
        type: [[String]],
        default: undefined,
        required: true,
    },
    role: {
        type: [String],
        default: undefined,
        required: true,
    },
    user_intro: {
        type: [String],
        default: undefined,
        required: true,
    },
    to_share: {
        type: [[String]],
        default: undefined,
        required: true,
    },
    to_ask: {
        type: [[String]],
        default: undefined,
        required: true,
    },
    accept: {
        type: [[String]],
        required: true,
    },
});
const Meeting = mongoose_1.default.model('Meeting', meetingSchema);
function createMeeting(user, role, rating, meetingComments, userIntro, toShare, toAsk) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield Meeting.create({
            users: [user],
            role: [role],
            ratings: [rating],
            meeting_comments: [meetingComments],
            user_intro: [userIntro],
            to_share: [toShare],
            to_ask: [toAsk],
        });
        return result;
    });
}
exports.createMeeting = createMeeting;
function joinMeeting(metUsers, user, role, rating, meetingComments, userIntro, toShare, toAsk) {
    return __awaiter(this, void 0, void 0, function* () {
        const creatorShouldShare = [];
        toAsk.forEach((ask) => {
            creatorShouldShare.push({
                text: {
                    query: `"${ask}"`,
                    path: 'to_share',
                },
            });
        });
        const creatorShouldAsk = [];
        toShare.forEach((share) => {
            creatorShouldAsk.push({
                text: {
                    query: `"${share}"`,
                    path: 'to_ask',
                },
            });
        });
        let mustNotArray = [];
        if (metUsers.length > 0) {
            mustNotArray = [
                {
                    in: {
                        path: 'users',
                        value: metUsers,
                    },
                },
            ];
        }
        const result = yield Meeting.aggregate([
            {
                $search: {
                    index: 'meeting',
                    compound: {
                        must: [
                            {
                                compound: {
                                    should: creatorShouldShare,
                                },
                            },
                            {
                                compound: {
                                    should: creatorShouldAsk,
                                },
                            },
                        ],
                        should: [],
                        mustNot: mustNotArray,
                        filter: [
                            {
                                text: {
                                    query: '"pending"',
                                    path: 'status',
                                },
                            },
                        ],
                    },
                },
            },
            {
                $addFields: {
                    score: {
                        $meta: 'searchScore',
                    },
                },
            },
            {
                $sort: {
                    score: -1,
                },
            },
            {
                $limit: 1,
            },
        ]);
        // console.log(result);
        if (!result[0]) {
            // create a new one
            return false;
        }
        // else joing the meeting
        const meetingId = result[0]._id;
        const userId = new mongodb_1.ObjectId(user);
        yield Meeting.updateOne({ _id: meetingId }, {
            $push: {
                users: userId,
                role,
                ratings: rating,
                meeting_comments: meetingComments,
                user_intro: userIntro,
                to_share: toShare,
                to_ask: toAsk,
            },
            status: 'checking',
        });
        // console.log(result);
        return result[0];
    });
}
exports.joinMeeting = joinMeeting;
exports.default = Meeting;
