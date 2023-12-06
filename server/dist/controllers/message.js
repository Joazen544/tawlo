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
exports.readMessages = exports.sendMessage = exports.getMoreMessages = exports.getNativeMessageGroups = exports.clickChatRoom = void 0;
const mongodb_1 = require("mongodb");
const messageGroup_1 = __importStar(require("../models/messageGroup"));
const errorHandler_1 = require("../utils/errorHandler");
const message_1 = require("../models/message");
const socket_1 = require("./socket");
function getMessagesFromDB(lastMessage, messageGroup) {
    return __awaiter(this, void 0, void 0, function* () {
        let messages;
        if (lastMessage) {
            messages = yield (0, message_1.getEarlierMessages)(messageGroup, lastMessage);
        }
        else {
            messages = yield (0, message_1.getLatestMessages)(messageGroup);
        }
        return messages;
    });
}
function clickChatRoom(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        // if user click 'send message to specific user'
        // return the message group info if it exists
        // else create one for them
        try {
            const { user } = req.body;
            const target = req.query.target;
            const group = req.query.group;
            const userId = new mongodb_1.ObjectId(user);
            let targetId;
            let messageGroup;
            if (target) {
                targetId = new mongodb_1.ObjectId(target);
                if (user === target) {
                    next(new errorHandler_1.ValidationError('Target id can not be same with user'));
                }
                messageGroup = yield messageGroup_1.default.findOne({
                    users: { $all: [userId, targetId] },
                });
                // console.log(messageGroup);
                if (messageGroup === null) {
                    const messageGroupCreated = yield messageGroup_1.default.create({
                        users: [userId, targetId],
                        category: 'native',
                        start_time: new Date(),
                        update_time: new Date(),
                        last_message: 'No message yet',
                    });
                    // console.log(messageGroupCreated);
                    res.json({
                        situation: 'second',
                        groupId: messageGroupCreated._id,
                        users: messageGroupCreated.users,
                        category: messageGroupCreated.category,
                        messages: [],
                    });
                    return;
                }
            }
            else if (group) {
                const groupId = new mongodb_1.ObjectId(group);
                messageGroup = yield messageGroup_1.default.findOne({
                    _id: groupId,
                });
            }
            else {
                throw new errorHandler_1.ValidationError('There must be target user id or chat room id in the query');
            }
            // console.log(messageGroup);
            if (messageGroup === null) {
                throw new errorHandler_1.ValidationError('This chat room does not exist');
            }
            try {
                (0, message_1.makeAllMessagesRead)(userId, messageGroup._id, messageGroup.last_sender);
            }
            catch (err) {
                console.log('something is wrong making messages read');
            }
            const messages = yield getMessagesFromDB(null, messageGroup._id);
            const messagesNotRemoved = messages.map((message) => {
                if (message.is_removed === false) {
                    return message;
                }
                message.content = 'This message was removed';
                return message;
            });
            res.json({
                situation: 'second',
                groupId: messageGroup._id,
                users: messageGroup.users,
                category: messageGroup.category,
                messages: messagesNotRemoved,
            });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.clickChatRoom = clickChatRoom;
function getNativeMessageGroups(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user } = req.body;
            const userId = new mongodb_1.ObjectId(user);
            const lastGroup = req.query.lastGroup;
            let lastGroupId;
            if (lastGroup) {
                lastGroupId = new mongodb_1.ObjectId(lastGroup);
            }
            else {
                lastGroupId = null;
            }
            const messageGroups = yield (0, messageGroup_1.getNativeMessageGroupsFromDB)(userId, lastGroupId);
            if (messageGroups instanceof Error) {
                next(messageGroups);
                return;
            }
            messageGroups.forEach((group) => {
                group.users = group.users.filter((target) => target.toString() !== userId.toString());
                if (group.users.length === 0) {
                    group.users.push(userId);
                }
            });
            res.json({
                messageGroups,
            });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getNativeMessageGroups = getNativeMessageGroups;
// to load more messages
function getMoreMessages(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const group = req.query.group;
            if (!group) {
                throw new errorHandler_1.ValidationError('Last message read id should be in query');
            }
            const lastMessage = req.query.lastMessage;
            const groupId = new mongodb_1.ObjectId(group);
            let lastMessageId;
            if (lastMessage) {
                lastMessageId = new mongodb_1.ObjectId(lastMessage);
            }
            else {
                throw new errorHandler_1.ValidationError('Last message read id should be in query');
            }
            const messages = yield getMessagesFromDB(lastMessageId, groupId);
            res.json({ messages });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.getMoreMessages = getMoreMessages;
function createMessage(group, from, content) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const time = new Date();
            const groupId = new mongodb_1.ObjectId(group);
            const fromId = new mongodb_1.ObjectId(from);
            yield (0, message_1.createMessageToDB)(groupId, fromId, content, time);
            yield (0, messageGroup_1.updateLatestMessageToGroup)(groupId, fromId, content, time);
        }
        catch (err) {
            console.log('something goes wrong creating message to DB');
            console.log(err);
            throw new Error('something goes wrong creating message to DB');
        }
    });
}
function sendMessage(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, messageTo, messageGroup, content } = req.body;
            const io = (0, socket_1.getIO)();
            if (!io) {
                res.status(500).json({ message: 'io connection fail' });
                return;
            }
            yield createMessage(messageGroup, user, content);
            io.to(user).emit('myself', {
                message: content,
                group: messageGroup,
            });
            io.to(messageTo).emit('message', {
                message: content,
                from: user,
                group: messageGroup,
            });
            res.json({ message: 'message sent' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.sendMessage = sendMessage;
function readMessages(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('making messages read');
            const { user, messageGroupId } = req.body;
            const userId = new mongodb_1.ObjectId(user);
            const messageGroup = yield messageGroup_1.default.findOne({ _id: messageGroupId });
            if (!messageGroup) {
                res.status(400).json({ error: 'message group does not exist' });
                return;
            }
            (0, message_1.makeAllMessagesRead)(userId, messageGroup._id, messageGroup.last_sender);
            res.json({ message: 'updated read message' });
        }
        catch (err) {
            next(err);
        }
    });
}
exports.readMessages = readMessages;
