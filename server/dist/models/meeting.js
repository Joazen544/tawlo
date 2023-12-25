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
exports.getAskings = exports.getSharings = exports.joinMeeting = exports.createMeeting = void 0;
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
                phrase: { query: `${ask}`, path: 'to_share' },
            });
        });
        const creatorShouldAsk = [];
        toShare.forEach((share) => {
            creatorShouldAsk.push({
                phrase: { query: `${share}`, path: 'to_ask' },
            });
        });
        let mustNotArray = [];
        if (metUsers.length > 0) {
            mustNotArray = [{ in: { path: 'users', value: metUsers } }];
        }
        const result = yield Meeting.aggregate([
            {
                $search: {
                    index: 'meeting',
                    compound: {
                        must: [
                            { compound: { should: creatorShouldShare } },
                            { compound: { should: creatorShouldAsk } },
                        ],
                        should: [],
                        mustNot: mustNotArray,
                        filter: [
                            {
                                phrase: { query: 'pending', path: 'status' },
                            },
                        ],
                    },
                },
            },
            {
                $addFields: { score: { $meta: 'searchScore' } },
            },
            { $sort: { score: -1 } },
            { $limit: 1 },
        ]);
        if (!result[0]) {
            return false;
        }
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
        return result[0];
    });
}
exports.joinMeeting = joinMeeting;
function getSharings(search) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield Meeting.aggregate([
            {
                $match: { status: 'pending' },
            },
            {
                $unwind: { path: '$to_share' },
            },
            {
                $match: { to_share: { $regex: search } },
            },
            { $project: { to_share: 1 } },
        ]);
        const map = new Map();
        // eslint-disable-next-line array-callback-return, consistent-return
        const filterArray = results.filter((el) => {
            if (!map.get(el.to_share[0])) {
                map.set(el.to_share[0], 1);
                return el;
            }
        });
        const returnArray = filterArray.map((el) => el.to_share[0]);
        return returnArray;
    });
}
exports.getSharings = getSharings;
function getAskings(search) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = yield Meeting.aggregate([
            {
                $match: {
                    status: 'pending',
                },
            },
            {
                $unwind: {
                    path: '$to_ask',
                },
            },
            {
                $match: {
                    to_ask: {
                        $regex: search,
                    },
                },
            },
            {
                $project: {
                    to_ask: 1,
                },
            },
        ]);
        const map = new Map();
        // eslint-disable-next-line array-callback-return, consistent-return
        const filterArray = results.filter((el) => {
            if (!map.get(el.to_ask[0])) {
                map.set(el.to_ask[0], 1);
                return el;
            }
        });
        const returnArray = filterArray.map((el) => el.to_ask[0]);
        return returnArray;
    });
}
exports.getAskings = getAskings;
exports.default = Meeting;
