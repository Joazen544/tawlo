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
exports.makeAllMessagesRead = exports.createMessageToDB = exports.getEarlierMessages = exports.getLatestMessages = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const messageGroup_1 = __importDefault(require("./messageGroup"));
const MESSAGE_PER_PAGE = 20;
const messageSchema = new mongoose_1.default.Schema({
    group: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
    },
    from: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    time: {
        type: Date,
        required: true,
    },
    is_removed: {
        type: Boolean,
        default: false,
    },
    liked: {
        number: { type: Number, default: 0 },
        users: { type: [mongodb_1.ObjectId], default: [] },
    },
    read: [mongodb_1.ObjectId],
});
const Message = mongoose_1.default.model('Message', messageSchema);
function getLatestMessages(group) {
    return __awaiter(this, void 0, void 0, function* () {
        const messages = yield Message.find({ group })
            .sort({ _id: -1 })
            .limit(MESSAGE_PER_PAGE);
        const returnMessages = messages.reverse();
        return returnMessages;
    });
}
exports.getLatestMessages = getLatestMessages;
function getEarlierMessages(group, lastMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const messages = yield Message.find({ group, _id: { $lt: lastMessage } })
            .sort({ _id: -1 })
            .limit(MESSAGE_PER_PAGE);
        const returnMessages = messages.reverse();
        return returnMessages;
    });
}
exports.getEarlierMessages = getEarlierMessages;
function createMessageToDB(group, from, content, time) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield Message.create({
            group,
            from,
            time,
            content,
            read: [from],
        });
        console.log('~~~~');
        return result;
    });
}
exports.createMessageToDB = createMessageToDB;
function makeAllMessagesRead(userId, messageGroupId, last_sender) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield Message.updateMany({ group: messageGroupId, read: { $ne: userId } }, { $push: { read: userId } });
            console.log('making');
            if (last_sender !== userId) {
                console.log('making 2');
                console.log(messageGroupId);
                yield messageGroup_1.default.updateOne({ _id: messageGroupId }, { unread: 0 });
            }
        }
        catch (err) {
            console.log(err);
            console.log('something is wrong making messages read');
        }
    });
}
exports.makeAllMessagesRead = makeAllMessagesRead;
exports.default = Message;
