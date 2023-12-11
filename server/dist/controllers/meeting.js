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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMeeting = exports.scoreMeeting = exports.replyMeeting = exports.getMeeting = exports.accessMeeting = void 0;
const mongodb_1 = require("mongodb");
const meeting_1 = __importStar(require("../models/meeting"));
const socket_1 = require("./socket");
const user_1 = __importStar(require("../models/user"));
function accessMeeting(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, role, userIntro, toShare, toAsk } = req.body;
            if (!role || !userIntro || !toShare || !toAsk) {
                res
                    .status(400)
                    .json({ error: 'role, user info, to share ,to ask must not be null' });
                return;
            }
            const metUsersResult = yield user_1.default.findOne({ _id: user }, { met_users: 1, rating: 1, meeting_comments: 1, meeting_status: 1 });
            // console.log('22222');
            if (!metUsersResult) {
                res.status(500).json({ error: 'user not found' });
                return;
            }
            if (metUsersResult.meeting_status === 'end') {
                res
                    .status(500)
                    .json({ error: 'user should give last meeting a score first' });
                return;
            }
            if (metUsersResult.meeting_status !== 'none') {
                res.status(500).json({ error: 'user already has a meeting' });
                return;
            }
            const metUsers = metUsersResult.met_users || [];
            const meetingComments = metUsersResult.meeting_comments || [];
            const { rating } = metUsersResult;
            if (!rating) {
                res.status(400).json({ error: 'user does not have rating property' });
                return;
            }
            const joinResult = yield (0, meeting_1.joinMeeting)(metUsers, user, role, rating, meetingComments, userIntro, toShare, toAsk);
            if (joinResult) {
                // joined a meeting
                // send notification to both users
                // can be better!!!
                try {
                    yield user_1.default.updateOne({ _id: joinResult.users[0] }, {
                        meeting: joinResult._id,
                        meeting_status: 'checking',
                        $push: { met_users: user },
                    });
                    (0, user_1.addNotificationToUserDB)(joinResult.users[0], 'meet_match', null, null);
                    const io = (0, socket_1.getIO)();
                    if (!io) {
                        res.status(500).json({ message: 'io connection fail' });
                        return;
                    }
                    // console.log('send io 1');
                    io.to(joinResult.users[0].toString()).emit('notificate', {
                        category: 'meet_match',
                        message: '配對成功，看看對方的資訊吧 ouo',
                    });
                    // console.log('send io 2');
                    yield user_1.default.updateOne({ _id: user }, {
                        meeting: joinResult._id,
                        meeting_status: 'checking',
                        $push: { met_users: joinResult.users[0] },
                    });
                    // addNotificationToUserDB(userId, 'meet_match', null, null);
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
            // else, if false: create a new one
            const createResult = yield (0, meeting_1.createMeeting)(user, role, rating, meetingComments, userIntro, toShare, toAsk);
            yield user_1.default.updateOne({ _id: user }, { meeting: createResult._id, meeting_status: 'pending' });
            res.json({
                status: 'No meeting to join, created meeting',
                meetingId: createResult._id,
            });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.accessMeeting = accessMeeting;
function getMeeting(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const userId = new mongodb_1.ObjectId(user);
            const result = yield user_1.default.aggregate([
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
            // console.log(result[0].meeting_status);
            if (result[0] && result[0].meeting_status === 'none') {
                res.json({ status: 'none', message: 'no meeting now' });
                return;
            }
            let targetIndex = -1;
            let userIndex = -1;
            // console.log(result[0]);
            if (!result[0].meeting[0]) {
                res.status(400).json({ error: 'the meeting does not exist' });
                return;
            }
            result[0].meeting[0].users.forEach((userInfo, index) => {
                if (userInfo.toString() === user) {
                    // console.log('weee');
                    userIndex = index;
                }
                else {
                    // console.log('aaaa');
                    targetIndex = index;
                }
            });
            if (result[0].meeting_status === 'pending') {
                res.json({
                    _id: result[0]._id,
                    status: result[0].meeting_status,
                    meeting: {
                        _id: result[0].meeting[0]._id,
                        status: result[0].meeting[0].status,
                        user: {
                            userId: result[0].meeting[0].users[0],
                            role: result[0].meeting[0].role[0],
                            user_intro: result[0].meeting[0].user_intro[0],
                            rating: Math.round(result[0].meeting[0].ratings[0] * 10) / 10,
                            meeting_comment: result[0].meeting[0].meeting_comments[0],
                            to_share: result[0].meeting[0].to_share[0],
                            to_ask: result[0].meeting[0].to_ask[0],
                        },
                    },
                });
                return;
            }
            // console.log(JSON.stringify(result[0], null, 4));
            if (userIndex >= 0 && targetIndex >= 0) {
                res.json({
                    _id: result[0]._id,
                    status: result[0].meeting_status,
                    meeting: {
                        _id: result[0].meeting[0]._id,
                        status: result[0].meeting[0].status,
                        user: {
                            userId: result[0].meeting[0].users[userIndex],
                            role: result[0].meeting[0].role[userIndex],
                            user_intro: result[0].meeting[0].user_intro[userIndex],
                            rating: Math.round(result[0].meeting[0].ratings[userIndex] * 10) / 10,
                            meeting_comment: result[0].meeting[0].meeting_comments[userIndex],
                            to_share: result[0].meeting[0].to_share[userIndex],
                            to_ask: result[0].meeting[0].to_ask[userIndex],
                        },
                        target: {
                            userId: result[0].meeting[0].users[targetIndex],
                            role: result[0].meeting[0].role[targetIndex],
                            user_intro: result[0].meeting[0].user_intro[targetIndex],
                            rating: Math.round(result[0].meeting[0].ratings[targetIndex] * 10) / 10,
                            meeting_comment: result[0].meeting[0].meeting_comments[targetIndex],
                            to_share: result[0].meeting[0].to_share[targetIndex],
                            to_ask: result[0].meeting[0].to_ask[targetIndex],
                        },
                    },
                });
                return;
            }
            res.status(500).json({ error: 'something is wrong getting meeting info' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getMeeting = getMeeting;
function replyMeeting(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, reply } = req.body;
            const { meetingId } = req.params;
            // reply: accept, deny
            if (!reply || !meetingId) {
                res
                    .status(400)
                    .json({ error: 'reply and meetingId can not be undefined' });
                return;
            }
            if (reply !== 'accept' && reply !== 'deny') {
                res.status(400).json({ error: 'reply must be accept or deny' });
            }
            const meeting = yield meeting_1.default.findOne({ _id: meetingId });
            if (!meeting) {
                res.status(400).json({ error: 'meeting does not exist' });
                return;
            }
            if (!meeting.users.includes(user)) {
                res.status(400).json({ error: 'meeting does not include this user' });
                return;
            }
            if (meeting.status !== 'checking') {
                res.status(400).json({ error: 'the meeting is not checking' });
                return;
            }
            // console.log(meeting);
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
                // notificate them
                (0, user_1.addNotificationToUserDB)(meeting.users[0], 'meet_success', null, null);
                (0, user_1.addNotificationToUserDB)(meeting.users[1], 'meet_success', null, null);
                const io = (0, socket_1.getIO)();
                if (!io) {
                    res.status(500).json({ message: 'io connection fail' });
                    return;
                }
                io.to(meeting.users[0].toString()).emit('notificate', {
                    category: 'meet_success',
                    message: '雙方都接受配對了，來跟對方聯絡吧！',
                });
                io.to(meeting.users[1].toString()).emit('notificate', {
                    category: 'meet_success',
                    message: '雙方都接受配對了，來跟對方聯絡吧！',
                });
                // open a chat for them
                req.query.target = meeting.accept[0].toString();
                next();
                return;
            }
            // make the meeting fail and find new meetings for both users
            yield meeting_1.default.updateOne({ _id: meetingId }, { $set: { status: 'fail' } });
            meeting.users.forEach((userId, index) => __awaiter(this, void 0, void 0, function* () {
                const metUsersResult = yield user_1.default.findOne({ _id: userId }, { met_users: 1, rating: 1, meeting_status: 1 });
                if (!metUsersResult) {
                    res
                        .status(500)
                        .json({ error: 'can not find user while updating meeting' });
                    return;
                }
                const metUsers = metUsersResult.met_users || [];
                const joinResult = yield (0, meeting_1.joinMeeting)(metUsers, userId.toString(), meeting.role[index], meeting.ratings[index], meeting.meeting_comments[index], meeting.user_intro[index], meeting.to_share[index], meeting.to_ask[index]);
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
                        (0, user_1.addNotificationToUserDB)(joinResult.users[0], 'meet_match', null, null);
                        (0, user_1.addNotificationToUserDB)(userId, 'meet_match', null, null);
                        const io = (0, socket_1.getIO)();
                        if (!io) {
                            res.status(500).json({ message: 'io connection fail' });
                            return;
                        }
                        io.to(joinResult.users[0].toString()).emit('notificate', {
                            category: 'meet_match',
                            message: '配對成功，看看對方的資訊吧 OAO',
                        });
                        io.to(userId.toString()).emit('notificate', {
                            category: 'meet_match',
                            message: '配對成功，看看對方的資訊吧 XDD',
                        });
                    }
                    catch (err) {
                        throw new Error(`something wrong updating meeting info for users: ${err}`);
                    }
                }
                else {
                    // else, if false: create a new one
                    const createResult = yield (0, meeting_1.createMeeting)(userId.toString(), meeting.role[index], meeting.ratings[index], meeting.meeting_comments[index], meeting.user_intro[index], meeting.to_share[index], meeting.to_ask[index]);
                    (0, user_1.addNotificationToUserDB)(userId, 'meet_fail', null, null);
                    yield user_1.default.updateOne({ _id: userId }, { meeting: createResult._id, meeting_status: 'pending' });
                    // notificate the user the result
                    const io = (0, socket_1.getIO)();
                    if (!io) {
                        res.status(500).json({ message: 'io connection fail' });
                        return;
                    }
                    io.to(userId.toString()).emit('notificate', {
                        category: 'meet_fail',
                        message: '配對失敗，自動重新配對',
                    });
                }
            }));
            res.json({ message: 'create or join new meeting for users' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.replyMeeting = replyMeeting;
function scoreMeeting(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, score, targetUser, comment } = req.body;
            const { meetingId } = req.params;
            // console.log(user);
            if (!comment) {
                res.status(400).json({ error: 'comment is missing' });
                return;
            }
            if (!score) {
                res.status(400).json({ error: 'score is missing' });
                return;
            }
            if (typeof score !== 'number') {
                res.status(400).json({ error: 'score is not number' });
                return;
            }
            // console.log(meetingId);
            const meeting = yield meeting_1.default.findOne({ _id: meetingId });
            if (!meeting) {
                res.status(400).json({ error: 'meeting does not exist' });
                return;
            }
            if (!meeting.users.includes(user)) {
                res.status(400).json({ error: 'meeting does not include this user' });
                return;
            }
            if (!meeting.users.includes(targetUser)) {
                res.status(400).json({ error: 'meeting does not include target user' });
                return;
            }
            // console.log(score);
            const userInfo = yield user_1.default.findOne({ _id: targetUser });
            if (!userInfo) {
                res.status(400).json({ error: 'user does not exist' });
                return;
            }
            const { rating } = userInfo;
            const ratingNumber = userInfo.rating_number;
            const newRatingNumber = ratingNumber + 1;
            const newRating = (rating * ratingNumber + score) / newRatingNumber;
            // console.log(newRating);
            yield user_1.default.updateOne({ _id: targetUser }, {
                $set: {
                    rating: newRating,
                    rating_number: newRatingNumber,
                },
                $push: { meeting_comments: comment },
            });
            yield user_1.default.updateOne({ _id: user }, { $set: { meeting_status: 'none' } });
            res.json({ message: 'scored last meeting, can now create new meeting' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.scoreMeeting = scoreMeeting;
function cancelMeeting(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const userMeetingInfo = yield user_1.default.findOne({ _id: user }, { meeting_status: 1, meeting: 1 });
            if (!userMeetingInfo) {
                res.status(400).json({ error: 'user does not exist' });
                return;
            }
            if (userMeetingInfo.meeting_status !== 'pending') {
                res.status(400).json({ error: 'user can only cancel pending meeting' });
                return;
            }
            yield meeting_1.default.updateOne({ _id: userMeetingInfo.meeting }, { status: 'fail' });
            yield user_1.default.updateOne({ _id: user }, { $set: { meeting_status: 'none' } });
            res.json({ message: 'cancel meeting success' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.cancelMeeting = cancelMeeting;
