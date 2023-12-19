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
exports.refuseRequest = exports.getAllFriendsList = exports.getFriendsList = exports.changeImage = exports.readAllNotifications = exports.getNotifications = exports.cancelRequest = exports.sendRequest = exports.getUserRelation = exports.getUserInfo = exports.updateUserRead = exports.signIn = exports.signUp = void 0;
const mongodb_1 = require("mongodb");
const fs_1 = __importDefault(require("fs"));
const user_1 = __importStar(require("../models/user"));
const JWT_1 = require("../utils/JWT");
const socket_1 = require("./socket");
require("dotenv");
const redis_1 = __importDefault(require("../utils/redis"));
const CDN_DOMAIN = process.env.DISTRIBUTION_DOMAIN;
const USER_INFO_EXPIRE_SECONDS = 21600;
function signUp(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, email, password, passwordConfirm } = req.body;
            let image;
            if (req.file) {
                image = req.file.filename;
            }
            if (image) {
                fs_1.default.unlink(`${__dirname}/../../public/userImage/${image}`, () => { });
            }
            const userData = yield user_1.default.create({
                name,
                email,
                password,
                image,
                password_confirm: passwordConfirm,
            });
            const token = yield (0, JWT_1.signJWT)(userData._id.toString());
            res
                .cookie('jwtToken', token)
                .status(200)
                .json({
                access_token: token,
                access_expired: JWT_1.EXPIRE_TIME,
                user: {
                    id: userData._id,
                    name,
                    email,
                    picture: '',
                },
            });
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error && err.message.slice(0, 6) === 'E11000') {
                res.status(400).json({ errors: 'This email already exist' });
                return;
            }
            if (err instanceof Error) {
                res.status(400).json({ errors: err.message });
                return;
            }
            res.status(500).json({ errors: 'sign up failed' });
        }
    });
}
exports.signUp = signUp;
function signIn(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            const userData = yield user_1.default.findOne({ email }).select('+password');
            if (!userData ||
                !(yield userData.correctPassword(password, userData.password))) {
                res.status(401).json({ error: 'Incorrect email or password' });
                return;
            }
            const token = yield (0, JWT_1.signJWT)(userData._id.toString());
            res
                .cookie('jwtToken', token)
                .status(200)
                .json({
                access_token: token,
                access_expired: JWT_1.EXPIRE_TIME,
                user: {
                    id: userData._id,
                    name: userData.name,
                    email,
                    picture: '',
                },
            });
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                res.status(400).json({ errors: err.message });
                return;
            }
            res.status(500).json({ errors: 'sign in failed' });
        }
    });
}
exports.signIn = signIn;
function updateUserRead(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, posts } = req.body;
            const postsId = posts.map((post) => new mongodb_1.ObjectId(post));
            const userId = new mongodb_1.ObjectId(user);
            (0, user_1.updateUserReadPosts)(userId, postsId);
            res.json({ message: 'Update success' });
        }
        catch (err) {
            console.log(err);
            if (err instanceof Error) {
                res.status(400).json({ errors: err.message });
                return;
            }
            res.status(500).json({ errors: 'sign in failed' });
        }
    });
}
exports.updateUserRead = updateUserRead;
function getUserInfo(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.query;
            if (!id) {
                res.status(400).json({ error: 'user id is not in req body' });
                return;
            }
            if (typeof id !== 'string') {
                res.status(400).json({ error: 'user id is not string' });
                return;
            }
            try {
                const result = yield redis_1.default.hGetAll(`${id}info`);
                if (result.name && result.image !== undefined) {
                    // is saved in redis
                    let imageUrl;
                    if (result.image === '') {
                        imageUrl = '';
                    }
                    else {
                        imageUrl = `${CDN_DOMAIN}/user-image/${result.image}`;
                    }
                    // console.log('get user info from redis');
                    res.json({ image: imageUrl, name: result.name });
                    return;
                }
            }
            catch (err) {
                console.log(err);
                console.log('something is wrong getting user info from redis');
            }
            const userInfo = yield (0, user_1.getUserInfoFromDB)(id);
            if (!userInfo) {
                res.status(400).json({ error: 'user does not exist' });
                return;
            }
            let imageUrl;
            if (userInfo.image === '') {
                imageUrl = '';
            }
            else {
                imageUrl = `${CDN_DOMAIN}/user-image/${userInfo.image}`;
            }
            try {
                yield redis_1.default.hSet(`${id}info`, 'name', userInfo.name);
                yield redis_1.default.hSet(`${id}info`, 'image', userInfo.image);
                yield redis_1.default.expire(`${id}info`, USER_INFO_EXPIRE_SECONDS);
                console.log('set user name and image to redis');
            }
            catch (err) {
                console.log(err);
            }
            res.json({ image: imageUrl, name: userInfo.name });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getUserInfo = getUserInfo;
function getUserRelation(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const id = req.query.id;
            if (!id) {
                res.status(500).json({ error: 'target id is missing' });
                return;
            }
            const relation = yield (0, user_1.getUserRelationFromDB)(user, id);
            res.json({ relation });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getUserRelation = getUserRelation;
function sendRequest(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const id = req.query.id;
            if (!id) {
                res.status(500).json({ error: 'target id is missing' });
                return;
            }
            const result = yield (0, user_1.createRelation)(user, id);
            const userId = new mongodb_1.ObjectId(user);
            const targetUserId = new mongodb_1.ObjectId(id);
            const io = (0, socket_1.getIO)();
            if (!io) {
                res.status(500).json({ message: 'io connection fail' });
                return;
            }
            if (result === 'send') {
                (0, user_1.addNotificationToUserDB)(targetUserId, 'friend_request', userId, null);
                io.to(id).emit('notificate', {
                    category: 'friend_request',
                    message: '有人發出交友邀請',
                    actionUser: user,
                });
            }
            else if (result === 'accept') {
                (0, user_1.addNotificationToUserDB)(targetUserId, 'request_accepted', userId, null);
                io.to(id).emit('notificate', {
                    category: 'request_accepted',
                    message: '有人接受你的邀請',
                    actionUser: user,
                });
            }
            if (result) {
                res.json({ status: 'send or accept request success' });
                return;
            }
            res.status(500).json({ error: 'create friend relation fail' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.sendRequest = sendRequest;
function cancelRequest(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const id = req.query.id;
            if (!id) {
                res.status(500).json({ error: 'target id is missing' });
                return;
            }
            const result = yield (0, user_1.cancelRequestFromDB)(user, id);
            if (result) {
                res.json({ status: 'cancel request success' });
                return;
            }
            res.status(500).json({ error: 'cancel request fail' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.cancelRequest = cancelRequest;
function getNotifications(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const userId = new mongodb_1.ObjectId(user);
            const notifications = yield (0, user_1.getNotificationsFromDB)(userId);
            if (notifications === false) {
                res.status(400).json({ error: 'no such user' });
                return;
            }
            notifications.forEach((notification) => {
                switch (notification.category) {
                    case 'reply_post':
                        notification.message = '回覆了你的貼文';
                        break;
                    case 'comment_post':
                        notification.message = '在你的貼文留言';
                        break;
                    case 'upvote_post':
                        notification.message = '覺得你的貼文有用';
                        break;
                    case 'like_post':
                        notification.message = '喜歡你的貼文';
                        break;
                    case 'comment_replied':
                        notification.message = '回覆了你的留言';
                        break;
                    case 'like_comment':
                        notification.message = '喜歡你的留言';
                        break;
                    case 'meet_match':
                        notification.message = '配對成功，看看對方的資訊';
                        break;
                    case 'meet_success':
                        notification.message = '配對完成，找對方聊聊吧';
                        break;
                    case 'meet_fail':
                        notification.message = '配對失敗，重新找人中！';
                        break;
                    case 'friend_request':
                        notification.message = '有人想加你好友';
                        break;
                    case 'request_accepted':
                        notification.message = '交友邀請被接受囉';
                        break;
                    default:
                        notification.message = '';
                }
            });
            res.json(notifications.reverse());
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getNotifications = getNotifications;
function readAllNotifications(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const userId = new mongodb_1.ObjectId(user);
            const updateResult = yield (0, user_1.readNotificationsFromDB)(userId);
            if (updateResult === false) {
                res.status(400).json({
                    error: 'no such user or something wrong updating read all notifications',
                });
                return;
            }
            res.json({ message: 'read all notifications' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.readAllNotifications = readAllNotifications;
function changeImage(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            let imageName;
            if (req.file) {
                imageName = req.file.filename;
            }
            else {
                res.status(400).json({ error: 'no image in req' });
            }
            yield user_1.default.updateOne({ _id: user }, { $set: { image: imageName } });
            try {
                yield redis_1.default.del(`${user}info`);
                // console.log('delete user info from redis');
            }
            catch (err) {
                console.log(err);
            }
            if (imageName) {
                fs_1.default.unlink(`${__dirname}/../../public/userImage/${imageName}`, () => { });
            }
            res.json({ image: `${CDN_DOMAIN}/user-image/${imageName}` });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.changeImage = changeImage;
function getFriendsList(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            if (!user) {
                res.status(400).json({ error: 'no user info' });
                return;
            }
            const userFriends = yield (0, user_1.getUserFriendsFromDB)(user);
            res.json(userFriends);
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getFriendsList = getFriendsList;
function getAllFriendsList(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const userInfo = yield user_1.default.findOne({ _id: user });
            if (!userInfo) {
                res.status(400).json({ error: 'user does not exist' });
                return;
            }
            const requestedFriendArray = [];
            const receiveFriendArray = [];
            const friendArray = [];
            userInfo.friends.forEach((friend) => {
                if (friend.status === 'requested') {
                    requestedFriendArray.push(friend.user);
                }
                else if (friend.status === 'received') {
                    receiveFriendArray.push(friend.user);
                }
                else if (friend.status === 'friends') {
                    friendArray.push(friend.user);
                }
            });
            res.json({
                friend: friendArray,
                requested: requestedFriendArray,
                receive: receiveFriendArray,
            });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getAllFriendsList = getAllFriendsList;
function refuseRequest(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const id = req.query.id;
            if (!id) {
                res.status(500).json({ error: 'target id is missing' });
                return;
            }
            const result = yield (0, user_1.refuseRequestFromDB)(user, id);
            if (result) {
                res.json({ status: 'refuse request success' });
                return;
            }
            res.status(500).json({ error: 'refuse request fail' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.refuseRequest = refuseRequest;
