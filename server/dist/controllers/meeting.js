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
exports.getAskings = exports.getSharings = exports.cancelMeeting = exports.scoreMeeting = exports.replyMeeting = exports.getMeeting = exports.accessMeeting = void 0;
const mongodb_1 = require("mongodb");
const meeting_1 = __importStar(require("../models/meeting")), meetingModel = meeting_1;
const socket_1 = require("./socket");
const user_1 = __importStar(require("../models/user"));
const errorHandler_1 = require("../utils/errorHandler");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
exports.accessMeeting = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, role, userIntro, toShare, toAsk } = req.body;
    if (!role || !userIntro || !toShare || !toAsk) {
        throw new errorHandler_1.ValidationError('role, user info, to share, to ask needed');
    }
    const userMeetingInfo = yield user_1.default.findOne({ _id: user }, { met_users: 1, rating: 1, meeting_comments: 1, meeting_status: 1 });
    if (!userMeetingInfo) {
        throw new Error('user not found');
    }
    if (userMeetingInfo.meeting_status === 'end') {
        throw new Error('user should give last meeting a score first');
    }
    if (userMeetingInfo.meeting_status !== 'none') {
        throw new Error('user already has a meeting');
    }
    const metUsers = userMeetingInfo.met_users || [];
    const meetingComments = userMeetingInfo.meeting_comments || [];
    const { rating } = userMeetingInfo;
    if (!rating) {
        throw new Error('user does not have rating property');
    }
    const joinResult = yield meetingModel.joinMeeting(metUsers, user, role, rating, meetingComments, userIntro, toShare, toAsk);
    if (joinResult) {
        try {
            yield user_1.default.updateOne({ _id: joinResult.users[0] }, {
                meeting: joinResult._id,
                meeting_status: 'checking',
                $push: { met_users: user },
            });
            (0, user_1.addNotification)(joinResult.users[0], 'meet_match', null, null);
            (0, socket_1.sendNotificationThroughSocket)(joinResult.users[0].toString(), 'meet_match', '配對成功，看看對方的資訊吧', undefined, undefined);
            yield user_1.default.updateOne({ _id: user }, {
                meeting: joinResult._id,
                meeting_status: 'checking',
                $push: { met_users: joinResult.users[0] },
            });
        }
        catch (err) {
            throw new Error(`something wrong updating meeting info for users: ${err}`);
        }
        res.json({
            message: 'join meeting sucess, wait for checking',
            joinResult,
        });
        return;
    }
    // else, no meeting to join: create a new one
    const createMeetingResult = yield meetingModel.createMeeting(user, role, rating, meetingComments, userIntro, toShare, toAsk);
    yield user_1.default.updateOne({ _id: user }, { meeting: createMeetingResult._id, meeting_status: 'pending' });
    res.json({
        status: 'No meeting to join, created meeting',
        meetingId: createMeetingResult._id,
    });
}));
exports.getMeeting = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.body;
    const userId = new mongodb_1.ObjectId(user);
    const [meetingInfo] = yield user_1.default.aggregate([
        { $match: { _id: userId } },
        {
            $lookup: {
                from: 'meetings',
                localField: 'meeting',
                foreignField: '_id',
                as: 'meeting',
            },
        },
        { $project: { meeting: 1, meeting_status: 1 } },
    ]);
    if (meetingInfo && meetingInfo.meeting_status === 'none') {
        res.json({ status: 'none', message: 'no meeting now' });
        return;
    }
    // console.log(JSON.stringify(meetingInfo, null, 4));
    let targetIndex = -1;
    let userIndex = -1;
    if (!meetingInfo.meeting[0]) {
        res.status(400).json({ error: 'the meeting does not exist' });
        return;
    }
    const [meeting] = meetingInfo.meeting;
    meeting.users.forEach((userInfo, index) => {
        if (userInfo.toString() === user) {
            userIndex = index;
        }
        else {
            targetIndex = index;
        }
    });
    if (meetingInfo.meeting_status === 'pending') {
        res.json({
            _id: meetingInfo._id,
            status: meetingInfo.meeting_status,
            meeting: {
                _id: meeting._id,
                status: meeting.status,
                user: {
                    userId: meeting.users[0],
                    role: meeting.role[0],
                    user_intro: meeting.user_intro[0],
                    rating: Math.round(meeting.ratings[0] * 10) / 10,
                    meeting_comment: meeting.meeting_comments[0],
                    to_share: meeting.to_share[0],
                    to_ask: meeting.to_ask[0],
                },
            },
        });
        return;
    }
    if (userIndex >= 0 && targetIndex >= 0) {
        res.json({
            _id: meetingInfo._id,
            status: meetingInfo.meeting_status,
            meeting: {
                _id: meeting._id,
                status: meeting.status,
                user: {
                    userId: meeting.users[userIndex],
                    role: meeting.role[userIndex],
                    user_intro: meeting.user_intro[userIndex],
                    rating: Math.round(meeting.ratings[userIndex] * 10) / 10,
                    meeting_comment: meeting.meeting_comments[userIndex],
                    to_share: meeting.to_share[userIndex],
                    to_ask: meeting.to_ask[userIndex],
                },
                target: {
                    userId: meeting.users[targetIndex],
                    role: meeting.role[targetIndex],
                    user_intro: meeting.user_intro[targetIndex],
                    rating: Math.round(meeting.ratings[targetIndex] * 10) / 10,
                    meeting_comment: meeting.meeting_comments[targetIndex],
                    to_share: meeting.to_share[targetIndex],
                    to_ask: meeting.to_ask[targetIndex],
                },
            },
        });
        return;
    }
    res.status(500).json({ error: 'something is wrong getting meeting info' });
}));
exports.replyMeeting = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, reply } = req.body;
    const { meetingId } = req.params;
    if (!reply || !meetingId) {
        throw new errorHandler_1.ValidationError('reply and meetingId needed');
    }
    if (!['accept', 'deny'].includes(reply)) {
        throw new errorHandler_1.ValidationError('reply must be accept or deny');
    }
    const meeting = yield meeting_1.default.findOne({
        _id: meetingId,
    });
    if (!meeting) {
        throw new errorHandler_1.ValidationError('meeting does not exist');
    }
    if (!meeting.users.includes(user)) {
        throw new errorHandler_1.ValidationError('meeting does not include this user');
    }
    if (meeting.status !== 'checking') {
        throw new errorHandler_1.ValidationError('the meeting is not checking');
    }
    if (reply === 'accept') {
        // update the status of users, meeting to meeting
        // create a chat room for them
        // notificate them
        if (!meeting.accept[0]) {
            // the other one has not accepted yet
            yield meeting_1.default.updateOne({ _id: meetingId }, { $push: { accept: user } });
            yield user_1.default.updateOne({ _id: user }, { $set: { meeting_status: 'waiting' } });
            res.json({
                situation: 'first',
                message: 'accept success, waiting for another user to accept',
            });
            return;
        }
        // both users accept
        yield meeting_1.default.updateOne({ _id: meetingId }, { $push: { accept: user }, $set: { status: 'end' } });
        yield user_1.default.updateMany({ _id: meeting.users }, { $set: { meeting_status: 'end' } });
        (0, user_1.addNotification)(meeting.users[0], 'meet_success', null, null);
        (0, user_1.addNotification)(meeting.users[1], 'meet_success', null, null);
        (0, socket_1.sendNotificationThroughSocket)(meeting.users[0].toString(), 'meet_success', '雙方都接受配對了，來跟對方聯絡吧！', undefined, undefined);
        (0, socket_1.sendNotificationThroughSocket)(meeting.users[1].toString(), 'meet_success', '雙方都接受配對了，來跟對方聯絡吧！', undefined, undefined);
        // open a chat for them
        req.query.target = meeting.accept[0].toString();
        next();
        return;
    }
    // make the meeting fail and find new meetings for both users
    yield meeting_1.default.updateOne({ _id: meetingId }, { $set: { status: 'fail' } });
    meeting.users.forEach((userId, index) => __awaiter(void 0, void 0, void 0, function* () {
        const metUsersInfo = yield user_1.default.findOne({ _id: userId }, { met_users: 1, rating: 1, meeting_status: 1 });
        if (!metUsersInfo) {
            throw new Error('can not find user while updating meeting');
        }
        const metUsers = metUsersInfo.met_users || [];
        const joinResult = yield meetingModel.joinMeeting(metUsers, userId.toString(), meeting.role[index], meeting.ratings[index], meeting.meeting_comments[index], meeting.user_intro[index], meeting.to_share[index], meeting.to_ask[index]);
        if (joinResult) {
            // joined a meeting
            // send notification to both users
            try {
                yield user_1.default.updateOne({ _id: joinResult.users[0] }, {
                    meeting: joinResult._id,
                    meeting_status: 'checking',
                    $push: { met_users: userId },
                });
                yield user_1.default.updateOne({ _id: userId }, {
                    meeting: joinResult._id,
                    meeting_status: 'checking',
                    $push: { met_users: joinResult.users[0] },
                });
                (0, user_1.addNotification)(joinResult.users[0], 'meet_match', null, null);
                (0, user_1.addNotification)(userId, 'meet_match', null, null);
                (0, socket_1.sendNotificationThroughSocket)(joinResult.users[0].toString(), 'meet_match', '配對成功，看看對方的資訊吧', undefined, undefined);
                (0, socket_1.sendNotificationThroughSocket)(userId.toString(), 'meet_match', '配對成功，看看對方的資訊吧', undefined, undefined);
            }
            catch (err) {
                throw new Error(`something wrong updating meeting info for users: ${err}`);
            }
        }
        else {
            // else, if false: create a new one
            const createResult = yield meetingModel.createMeeting(userId.toString(), meeting.role[index], meeting.ratings[index], meeting.meeting_comments[index], meeting.user_intro[index], meeting.to_share[index], meeting.to_ask[index]);
            (0, user_1.addNotification)(userId, 'meet_fail', null, null);
            yield user_1.default.updateOne({ _id: userId }, { meeting: createResult._id, meeting_status: 'pending' });
            (0, socket_1.sendNotificationThroughSocket)(userId.toString(), 'meet_fail', '配對失敗，自動重新配對', undefined, undefined);
        }
    }));
    res.json({ message: 'create or join new meeting for users' });
}));
exports.scoreMeeting = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, score, targetUser, comment } = req.body;
    const { meetingId } = req.params;
    if (!comment) {
        throw new errorHandler_1.ValidationError('comment is needed');
    }
    if (!score) {
        throw new errorHandler_1.ValidationError('score is needed');
    }
    if (typeof score !== 'number') {
        throw new errorHandler_1.ValidationError('score is not number');
    }
    const meeting = yield meeting_1.default.findOne({ _id: meetingId });
    if (!meeting) {
        throw new errorHandler_1.ValidationError('meeting does not exist');
    }
    if (!meeting.users.includes(user)) {
        throw new errorHandler_1.ValidationError('meeting does not include this user');
    }
    if (!meeting.users.includes(targetUser)) {
        throw new errorHandler_1.ValidationError('meeting does not include target user');
    }
    const userInfo = yield user_1.default.findOne({ _id: targetUser });
    if (!userInfo) {
        throw new errorHandler_1.ValidationError('user does not exist');
    }
    const { rating } = userInfo;
    const ratingNumber = userInfo.rating_number;
    const newRatingNumber = ratingNumber + 1;
    const newRating = (rating * ratingNumber + score) / newRatingNumber;
    yield user_1.default.updateOne({ _id: targetUser }, {
        $set: {
            rating: newRating,
            rating_number: newRatingNumber,
        },
        $push: { meeting_comments: comment },
    });
    yield user_1.default.updateOne({ _id: user }, { $set: { meeting_status: 'none' } });
    res.json({ message: 'scored last meeting, can now create new meeting' });
}));
exports.cancelMeeting = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.body;
    const userMeetingInfo = yield user_1.default.findOne({ _id: user }, { meeting_status: 1, meeting: 1 });
    if (!userMeetingInfo) {
        throw new errorHandler_1.ValidationError('user does not exist');
        return;
    }
    if (userMeetingInfo.meeting_status !== 'pending') {
        throw new errorHandler_1.ValidationError('user can only cancel pending meeting');
    }
    yield meeting_1.default.updateOne({ _id: userMeetingInfo.meeting }, { status: 'fail' });
    yield user_1.default.updateOne({ _id: user }, { $set: { meeting_status: 'none' } });
    res.json({ message: 'cancel meeting success' });
}));
exports.getSharings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const search = req.query.search;
    if (!search) {
        throw new errorHandler_1.ValidationError('no search words');
    }
    const tags = yield meetingModel.getSharings(search);
    res.json(tags);
}));
exports.getAskings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const search = req.query.search;
    if (!search) {
        throw new errorHandler_1.ValidationError('no search words');
    }
    const tags = yield meetingModel.getAskings(search);
    res.json(tags);
}));
