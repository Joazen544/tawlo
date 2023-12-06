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
exports.updateLatestMessageToGroup = exports.getNativeMessageGroupsFromDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const GROUPS_PER_PAGE = 10;
const messageGroupSchema = new mongoose_1.default.Schema({
    users: {
        type: [mongodb_1.ObjectId],
        required: true,
    },
    category: {
        type: String,
        enum: ['native', 'explore'],
        required: true,
    },
    start_time: {
        type: Date,
        required: true,
    },
    update_time: {
        type: Date,
        required: true,
    },
    last_sender: mongodb_1.ObjectId,
    last_message: {
        type: String,
        required: true,
    },
    unread: {
        type: Number,
        default: 0,
    },
});
const MessageGroup = mongoose_1.default.model('MessageGroup', messageGroupSchema);
function getNativeMessageGroupsFromDB(userId, lastGroup) {
    return __awaiter(this, void 0, void 0, function* () {
        let groups;
        if (lastGroup) {
            const lastGroupInfo = yield MessageGroup.findOne({ _id: lastGroup });
            if (!lastGroupInfo) {
                return new Error('last message group does not exist');
            }
            const lastGroupUpdateTime = lastGroupInfo.update_time;
            groups = yield MessageGroup.find({
                users: userId,
                update_time: { $gt: lastGroupUpdateTime },
                category: 'native',
            })
                .sort({ update_time: -1 })
                .limit(GROUPS_PER_PAGE);
        }
        else {
            groups = MessageGroup.find({
                users: userId,
                category: 'native',
            })
                .sort({ update_time: -1 })
                .limit(GROUPS_PER_PAGE);
        }
        return groups;
    });
}
exports.getNativeMessageGroupsFromDB = getNativeMessageGroupsFromDB;
function updateLatestMessageToGroup(group, lastUser, lastMessage, updateTime) {
    return __awaiter(this, void 0, void 0, function* () {
        yield MessageGroup.updateOne({ _id: group }, {
            last_sender: lastUser,
            update_time: updateTime,
            last_message: lastMessage,
            $inc: { unread: 1 },
        });
    });
}
exports.updateLatestMessageToGroup = updateLatestMessageToGroup;
exports.default = MessageGroup;
