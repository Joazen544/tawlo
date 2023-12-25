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
exports.readMessages = exports.sendMessage = exports.getMoreMessages = exports.getMessageGroups = exports.clickChatRoom = void 0;
const mongodb_1 = require("mongodb");
const messageGroup_1 = __importStar(require("../models/messageGroup")), messageGroupModel = messageGroup_1;
const errorHandler_1 = require("../utils/errorHandler");
const messageModel = __importStar(require("../models/message"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const socket_1 = require("./socket");
const getMessagesFromDB = (lastMessage, messageGroup) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = lastMessage
        ? yield messageModel.getEarlierMessages(messageGroup, lastMessage)
        : yield messageModel.getLatestMessages(messageGroup);
    return messages;
});
const createMessage = (group, from, content) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const time = new Date();
        const groupId = new mongodb_1.ObjectId(group);
        const fromId = new mongodb_1.ObjectId(from);
        yield messageModel.createMessage(groupId, fromId, content, time);
        yield messageGroupModel.updateLatestMessageToGroup(groupId, fromId, content, time);
    }
    catch (err) {
        console.log('something goes wrong creating message to DB');
        console.log(err);
        throw new Error('something goes wrong creating message to DB');
    }
});
exports.clickChatRoom = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = req.body;
    const target = req.query.target;
    const group = req.query.group;
    if (!target && !group) {
        throw new errorHandler_1.ValidationError('There must be target user id or chat room id in the query');
    }
    const userId = new mongodb_1.ObjectId(user);
    let targetId;
    let messageGroup;
    if (target) {
        targetId = new mongodb_1.ObjectId(target);
        if (user === target) {
            throw new errorHandler_1.ValidationError('Target id can not be same with user');
        }
        messageGroup = yield messageGroup_1.default.findOne({
            users: { $all: [userId, targetId] },
        });
        if (messageGroup === null) {
            const messageGroupCreated = yield messageGroup_1.default.create({
                users: [userId, targetId],
                category: 'native',
                start_time: new Date(),
                update_time: new Date(),
                last_message: 'No message yet',
            });
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
    else {
        const groupId = new mongodb_1.ObjectId(group);
        messageGroup = yield messageGroup_1.default.findOne({
            _id: groupId,
        });
    }
    if (messageGroup === null) {
        throw new errorHandler_1.ValidationError('This chat room does not exist');
    }
    try {
        messageModel.makeAllMessagesRead(userId, messageGroup._id, messageGroup.last_sender);
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
}));
exports.getMessageGroups = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const messageGroups = yield messageGroupModel.getNativeMessageGroups(userId, lastGroupId);
    messageGroups.forEach((group) => {
        group.users = group.users.filter((target) => target.toString() !== userId.toString());
        if (group.users.length === 0) {
            group.users.push(userId);
        }
    });
    res.json({
        messageGroups,
    });
}));
exports.getMoreMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
exports.sendMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, messageTo, messageGroup, content } = req.body;
    yield createMessage(messageGroup, user, content);
    (0, socket_1.sendMessageThroughSocket)(user, content, messageTo, messageGroup);
    res.json({ message: 'message sent' });
}));
exports.readMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, messageGroupId } = req.body;
    const userId = new mongodb_1.ObjectId(user);
    const messageGroup = yield messageGroup_1.default.findOne({ _id: messageGroupId });
    if (!messageGroup) {
        throw new errorHandler_1.ValidationError('message group does not exist');
    }
    messageModel.makeAllMessagesRead(userId, messageGroup._id, messageGroup.last_sender);
    res.json({ message: 'updated read message' });
}));
