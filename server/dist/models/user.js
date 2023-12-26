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
exports.getUserFriends = exports.refuseRequest = exports.getUserInfo = exports.getUserImage = exports.readNotifications = exports.getNotifications = exports.addNotification = exports.cancelRequest = exports.createRelation = exports.getUserRelation = exports.getUserPreference = exports.updateUserReadPosts = exports.updateUserAction = exports.sortOriginalTags = exports.addNewTagsToPreference = exports.adjustOldPreferenceTagsScore = exports.updateReadBoards = exports.userSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
const validator_1 = __importDefault(require("validator"));
const bcrypt_1 = __importDefault(require("bcrypt"));
exports.userSchema = new mongoose_1.default.Schema({
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
    image: {
        type: String,
        default: '',
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
    notification: {
        type: [
            {
                time: Date,
                category: {
                    type: String,
                    enum: [
                        'reply_post',
                        'comment_post',
                        'comment_replied',
                        'upvote_post',
                        'like_post',
                        'like_comment',
                        'meet_match',
                        'meet_success',
                        'meet_fail',
                        'friend_request',
                        'request_accepted',
                    ],
                },
                // three the most
                // friends first
                action_users: [mongodb_1.ObjectId],
                // reply_post, comment_post, comment_replied
                // upvote_post,like_post,like_comment
                users_num: { type: Number, default: 0 },
                target_post: mongodb_1.ObjectId,
                read: Boolean,
                message: String,
            },
        ],
        default: [],
    },
    honor_now: { type: String, default: '' },
    honors: { type: [String], default: [] },
});
exports.userSchema.pre('save', function (next) {
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
exports.userSchema.methods.correctPassword = function (candidatePassword, userPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield bcrypt_1.default.compare(candidatePassword, userPassword);
        return result;
    });
};
const User = mongoose_1.default.model('User', exports.userSchema);
const updateReadBoards = (readBoards, board) => {
    readBoards.push(board);
    return readBoards.length > 4 ? readBoards.slice(1, 5) : readBoards;
};
exports.updateReadBoards = updateReadBoards;
const adjustOldPreferenceTagsScore = (originalTags, tags, TAG_LARGEST_POINT) => {
    const newTagsArray = [];
    tags.forEach((tag) => {
        let ifExist = 0;
        let ifScoreLessThanLargestPoint;
        const userPreferenceLength = originalTags.length;
        originalTags.forEach((preference) => {
            if (preference.name === tag && +preference.number <= TAG_LARGEST_POINT) {
                preference.number = +preference.number + userPreferenceLength;
                ifExist += 1;
                ifScoreLessThanLargestPoint = true;
            }
            else if (preference.name === tag) {
                ifScoreLessThanLargestPoint = false;
            }
        });
        if (ifExist) {
            if (ifScoreLessThanLargestPoint) {
                originalTags.forEach((preference) => {
                    preference.number = +preference.number - ifExist;
                });
            }
        }
        else if (originalTags.length === 0) {
            originalTags.push({ name: tag, number: 20 });
        }
        else if (originalTags.length < 10) {
            originalTags.push({ name: tag, number: 0 });
        }
        else {
            newTagsArray.push(tag);
        }
    });
    return { originalArray: originalTags, newTags: newTagsArray };
};
exports.adjustOldPreferenceTagsScore = adjustOldPreferenceTagsScore;
const addNewTagsToPreference = (originalSortedTags, newTags, REPLACE_TAG_TARGET) => {
    const newTagsArray = newTags;
    if (newTags.length > 0) {
        for (let i = REPLACE_TAG_TARGET + 1; i < originalSortedTags.length; i += 1) {
            newTags.forEach((tag, index) => {
                if (tag === originalSortedTags[i].name) {
                    originalSortedTags[REPLACE_TAG_TARGET].name =
                        originalSortedTags[i].name;
                    newTagsArray[index] = undefined;
                }
            });
        }
        const newPreferenceTags = originalSortedTags.slice(0, 9 - newTagsArray.length);
        newTagsArray.forEach((tag) => {
            if (tag !== undefined) {
                newPreferenceTags.push({ name: tag, number: 0 });
            }
        });
        return newPreferenceTags;
    }
    return originalSortedTags;
};
exports.addNewTagsToPreference = addNewTagsToPreference;
const sortOriginalTags = (oldTagsScoreAdjusted) => {
    return oldTagsScoreAdjusted.sort((aTag, bTag) => +bTag.number - +aTag.number);
};
exports.sortOriginalTags = sortOriginalTags;
function updateUserAction(userId, tags, board) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const REPLACE_TAG_TARGET = 5;
            const TAG_LARGEST_POINT = 30;
            const userData = yield User.findOne({ _id: userId });
            if (!userData) {
                throw new Error('user does not exist');
            }
            const preferenceTags = userData.preference_tags;
            if (!preferenceTags) {
                throw new Error('user preference does not exist');
            }
            const { originalArray, newTags } = (0, exports.adjustOldPreferenceTagsScore)(preferenceTags, tags, TAG_LARGEST_POINT);
            const preferenceTagsSorted = (0, exports.sortOriginalTags)(originalArray);
            const preferenceTagsAddingNew = (0, exports.addNewTagsToPreference)(preferenceTagsSorted, newTags, REPLACE_TAG_TARGET);
            const newReadBoards = (0, exports.updateReadBoards)(userData.read_board, board);
            yield User.updateOne({ _id: userId }, {
                $set: {
                    preference_tags: preferenceTagsAddingNew,
                    read_board: newReadBoards,
                },
            });
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.updateUserAction = updateUserAction;
function updateUserReadPosts(userId, readPosts) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield User.updateOne({ _id: userId }, [
            {
                $set: {
                    read_posts: {
                        $slice: [{ $concatArrays: ['$read_posts', readPosts] }, -100],
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
function getUserRelation(user, targetId) {
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
exports.getUserRelation = getUserRelation;
function createRelation(user, target) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield User.startSession();
        let result;
        try {
            session.startTransaction();
            const relation = yield getUserRelation(user, target);
            if (relation === null) {
                yield User.updateOne({ _id: user }, { $push: { friends: { user: target, status: 'requested' } } }, { session });
                yield User.updateOne({ _id: target }, { $push: { friends: { user, status: 'received' } } }, { session });
                result = 'send';
            }
            else if (relation === 'received') {
                yield User.updateOne({ _id: user, 'friends.user': target }, { $set: { 'friends.$.status': 'friends' } }, { session });
                yield User.updateOne({ _id: target, 'friends.user': user }, { $set: { 'friends.$.status': 'friends' } }, { session });
                result = 'accept';
            }
            else {
                result = 'error';
                throw Error('the relationship is neither null nor received');
            }
            yield session.commitTransaction();
        }
        catch (err) {
            console.log(err);
            yield session.abortTransaction();
            result = 'error';
        }
        finally {
            yield session.endSession();
        }
        return result;
    });
}
exports.createRelation = createRelation;
function cancelRequest(user, target) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield User.startSession();
        let result;
        try {
            session.startTransaction();
            const relation = yield getUserRelation(user, target);
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
exports.cancelRequest = cancelRequest;
function addNotification(userId, category, actionUser, targetPost) {
    return __awaiter(this, void 0, void 0, function* () {
        // time: Date;
        // category: string;
        // action_users: ObjectId[];
        // users_num: number;
        // read: boolean;
        // target_post
        // 'reply_post',
        // 'comment_post',
        // 'upvote_post',
        // 'like_post',
        // 'comment_replied',
        // 'like_comment',
        // 'meet_match',
        // 'meet_success',
        // 'meet_fail',
        // 'friend_request',
        // 'request_accepted',
        if (category === 'reply_post' ||
            category === 'comment_post' ||
            category === 'upvote_post' ||
            category === 'like_post' ||
            category === 'comment_replied' ||
            category === 'like_comment') {
            // if notification already exist add to it and make it unread
            const targetNotification = yield User.findOne({
                _id: userId,
                notification: {
                    $elemMatch: {
                        category,
                        target_post: targetPost,
                    },
                },
            });
            if (targetNotification) {
                yield User.updateOne({
                    _id: userId,
                    notification: {
                        $elemMatch: {
                            category,
                            target_post: targetPost,
                        },
                    },
                }, {
                    $push: {
                        'notification.$.action_users': { $each: [actionUser], $slice: -20 },
                    },
                    $inc: { 'notification.$.users_num': 1 },
                    $set: {
                        'notification.$.time': new Date(),
                        'notification.$.read': false,
                    },
                });
                return 'update';
            }
            // if notification hasn't exist yet, create a new one
            yield User.updateOne({ _id: userId }, {
                $push: {
                    notification: {
                        $each: [
                            {
                                category,
                                action_users: [actionUser],
                                target_post: targetPost,
                                users_num: 1,
                                time: new Date(),
                                read: false,
                            },
                        ],
                        $slice: -20,
                    },
                },
            });
            return 'create';
        }
        if (category === 'meet_match' ||
            category === 'meet_success' ||
            category === 'meet_fail') {
            yield User.updateOne({ _id: userId }, {
                $push: {
                    notification: {
                        $each: [
                            {
                                category,
                                time: new Date(),
                                read: false,
                            },
                        ],
                        $slice: -20,
                    },
                },
            });
            return 'create';
        }
        if (category === 'friend_request' || category === 'request_accepted') {
            yield User.updateOne({ _id: userId }, {
                $push: {
                    notification: {
                        $each: [
                            {
                                category,
                                action_users: [actionUser],
                                time: new Date(),
                                read: false,
                            },
                        ],
                        $slice: -20,
                    },
                },
            });
            return 'create';
        }
        return 'error';
    });
}
exports.addNotification = addNotification;
function getNotifications(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const userInfo = yield User.findOne({ _id: userId });
        if (!userInfo) {
            return false;
        }
        return userInfo.notification;
    });
}
exports.getNotifications = getNotifications;
function readNotifications(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const userUpdate = yield User.updateOne({ _id: userId, 'notification.read': false }, { $set: { 'notification.$[].read': true } });
        if (userUpdate.acknowledged === false) {
            return false;
        }
        return true;
    });
}
exports.readNotifications = readNotifications;
function getUserImage(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const userInfo = yield User.findOne({ _id: user }, { image: 1 });
        return userInfo;
    });
}
exports.getUserImage = getUserImage;
function getUserInfo(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const userInfo = yield User.findOne({ _id: user });
        return userInfo;
    });
}
exports.getUserInfo = getUserInfo;
function refuseRequest(user, target) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield User.startSession();
        let result;
        try {
            session.startTransaction();
            const relation = yield getUserRelation(user, target);
            if (relation === null) {
                throw Error('the relation does not exist');
            }
            else if (relation !== 'received') {
                throw Error('friends relation is not received');
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
exports.refuseRequest = refuseRequest;
function getUserFriends(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const userInfo = yield User.findOne({ _id: user });
        if (!userInfo) {
            return [];
        }
        const friendArray = userInfo.friends.filter((friend) => friend.status === 'friends');
        const returnArray = friendArray.map((el) => el.user);
        return returnArray;
    });
}
exports.getUserFriends = getUserFriends;
exports.default = User;
