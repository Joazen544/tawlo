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
exports.cancelRequestFromDB = exports.createRelation = exports.getUserRelationFromDB = exports.getUserPreference = exports.updateUserReadPosts = exports.updateUserAction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const validator_1 = __importDefault(require("validator"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name'],
    },
    met_users: [mongodb_1.ObjectId],
    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: [true, 'Please offer your email'],
        validate: [validator_1.default.isEmail, 'Please provide a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must contain at least 8 characters'],
        select: false,
    },
    introduction: {
        type: String,
        default: '',
    },
    meeting: mongodb_1.ObjectId,
    meeting_status: {
        type: String,
        default: 'none',
        enum: ['none', 'pending', 'checking', 'waiting', 'end'],
    },
    meeting_comments: [String],
    rating: {
        type: Number,
        default: 3,
    },
    rating_number: {
        type: Number,
        default: 1,
    },
    // Posts read 300 recorded
    read_posts: [mongodb_1.ObjectId],
    friends: [
        {
            user: mongodb_1.ObjectId,
            status: {
                type: String,
                enum: ['friends', 'requested', 'received', 'block', 'blocked'],
            },
            update_time: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    follow: [mongodb_1.ObjectId],
    block: [mongodb_1.ObjectId],
    // only record 5 board
    // or native board
    read_board: [mongodb_1.ObjectId],
    preference_tags: {
        type: [
            // record 5 tags
            // index 0 is the favorite, index 4 is soso
            {
                name: String,
                number: Number,
            },
        ],
        default: [{ name: '後端', number: 20 }],
    },
    recommend_mode: {
        type: String,
        default: 'auto',
        enum: ['auto', 'customize', 'time', 'hot'],
    },
    // chat rooms
    upvote: { type: Number, default: 0 },
    downvote: { type: Number, default: 0 },
    honor_now: { type: String, default: '' },
    honors: { type: [String], default: [] },
});
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        // Only run this function if password was actually modified
        if (!this.isModified('password'))
            return next();
        // Hash the password and delete the confirm
        this.password = yield bcrypt_1.default.hash(this.password, 12);
        // this.password_confirm = this.password;
        return next();
    });
});
userSchema.methods.correctPassword = function (candidatePassword, userPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield bcrypt_1.default.compare(candidatePassword, userPassword);
        return result;
    });
};
const User = mongoose_1.default.model('User', userSchema);
function updateUserAction(userId, tags, board) {
    try {
        User.findOne({ _id: userId }).then((doc) => {
            if (doc) {
                const replaceTarget = doc.preference_tags.length - 1;
                const tagsArray = [];
                tagsArray.concat(tags);
                tags.forEach((tag) => {
                    let ifExist = 0;
                    let lessThan30;
                    const len = doc.preference_tags.length;
                    doc.preference_tags.forEach((preference) => {
                        if (preference.name === tag && +preference.number <= 30) {
                            preference.number = +preference.number + len;
                            ifExist += 1;
                            lessThan30 = true;
                        }
                        else if (preference.name === tag) {
                            lessThan30 = false;
                        }
                    });
                    if (ifExist && lessThan30) {
                        doc.preference_tags.forEach((preference) => {
                            preference.number = +preference.number - ifExist;
                        });
                    }
                    else if (ifExist) {
                        console.log('nothing');
                    }
                    else if (len === 0) {
                        doc.preference_tags.push({ name: tag, number: 20 });
                    }
                    else if (len < 6) {
                        doc.preference_tags.push({ name: tag, number: 0 });
                    }
                    else {
                        doc.preference_tags[replaceTarget].name = tag;
                    }
                });
                if (board)
                    doc.read_board.push(board);
                if (doc.read_board.length > 4) {
                    doc.read_board = doc.read_board.slice(1, 5);
                }
                doc.preference_tags.sort((aTag, bTag) => +bTag.number - +aTag.number);
                doc.save();
            }
        });
    }
    catch (err) {
        console.log(err);
    }
}
exports.updateUserAction = updateUserAction;
function updateUserReadPosts(userId, readPosts) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield User.updateOne({ _id: userId }, [
            {
                $set: {
                    read_posts: {
                        $slice: [{ $concatArrays: ['$read_posts', readPosts] }, -30],
                    },
                },
            },
        ]);
        if (result.acknowledged !== true) {
            console.log('Something is wrong updating user read posts');
        }
    });
}
exports.updateUserReadPosts = updateUserReadPosts;
function getUserPreference(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userInfo = yield User.findOne({ _id: userId }, {
                _id: 1,
                preference_tags: 1,
                recommend_mode: 1,
                read_board: 1,
                read_posts: 1,
            });
            return userInfo;
        }
        catch (err) {
            console.log(err);
            return err;
        }
    });
}
exports.getUserPreference = getUserPreference;
function getUserRelationFromDB(user, targetId) {
    return __awaiter(this, void 0, void 0, function* () {
        // try {
        const userInfo = yield User.findOne({
            _id: user,
            'friends.user': targetId,
        }, {
            friends: { $elemMatch: { user: targetId } },
        });
        // console.log(userInfo);
        if (userInfo === null) {
            return null;
        }
        return userInfo.friends[0].status;
    });
}
exports.getUserRelationFromDB = getUserRelationFromDB;
function createRelation(user, target) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield User.startSession();
        let result;
        try {
            session.startTransaction();
            const relation = yield getUserRelationFromDB(user, target);
            if (relation === null) {
                yield User.updateOne({ _id: user }, { $push: { friends: { user: target, status: 'requested' } } }, { session });
                yield User.updateOne({ _id: target }, { $push: { friends: { user, status: 'received' } } }, { session });
            }
            else if (relation === 'received') {
                yield User.updateOne({ _id: user, 'friends.user': target }, { $set: { 'friends.$.status': 'friends' } }, { session });
                yield User.updateOne({ _id: target, 'friends.user': user }, { $set: { 'friends.$.status': 'friends' } }, { session });
            }
            yield session.commitTransaction();
            result = true;
        }
        catch (err) {
            console.log(err);
            yield session.abortTransaction();
            result = false;
        }
        finally {
            yield session.endSession();
        }
        return result;
    });
}
exports.createRelation = createRelation;
function cancelRequestFromDB(user, target) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield User.startSession();
        let result;
        try {
            session.startTransaction();
            const relation = yield getUserRelationFromDB(user, target);
            if (relation === null) {
                throw Error('the relation does not exist');
            }
            else if (relation === 'friends') {
                throw Error('friends relation is not request');
            }
            yield User.updateOne({ _id: user }, { $pull: { friends: { user: target } } }, { session });
            yield User.updateOne({ _id: target }, { $pull: { friends: { user } } }, { session });
            yield session.commitTransaction();
            result = true;
        }
        catch (err) {
            console.log(err);
            yield session.abortTransaction();
            result = false;
        }
        finally {
            yield session.endSession();
        }
        return result;
    });
}
exports.cancelRequestFromDB = cancelRequestFromDB;
exports.default = User;
