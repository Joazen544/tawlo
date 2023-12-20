import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import validator from 'validator';
import bcrypt from 'bcrypt';

export interface UserDocument extends Document {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  image: string;
  introduction: string;
  // password_confirm: string;
  read_posts: ObjectId[];
  friends: {
    user: ObjectId;
    status: string;
    update_time: Date;
  }[];
  meeting: ObjectId;
  meeting_status: string;
  meeting_comments: string[];
  met_users: ObjectId[];
  rating: number;
  rating_number: number;
  follow: ObjectId[];
  block: ObjectId[];
  read_board: ObjectId[];
  preference_tags: { name: string; number: Number }[];
  recommend_mode: string;
  upvote: number;
  downvote: number;
  honor_now: string;
  notification: {
    time: Date;
    category: string;
    action_users: ObjectId[];
    target_post: ObjectId;
    users_num: number;
    read: boolean;
    message: string;
  }[];
  honors: string[];
  correctPassword: (arg1: string, arg2: string) => Boolean;
}

const userSchema = new mongoose.Schema<UserDocument>({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  met_users: [ObjectId],
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, 'Please offer your email'],
    validate: [validator.isEmail, 'Please provide a valid email'],
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
  meeting: ObjectId,
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
  read_posts: [ObjectId],
  friends: [
    {
      user: ObjectId,
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
  follow: [ObjectId],
  block: [ObjectId],
  // only record 5 board
  // or native board
  read_board: [ObjectId],
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
        action_users: [ObjectId],
        // reply_post, comment_post, comment_replied
        // upvote_post,like_post,like_comment
        users_num: { type: Number, default: 0 },
        target_post: ObjectId,
        read: Boolean,
        message: String,
      },
    ],
    default: [],
  },
  honor_now: { type: String, default: '' },
  honors: { type: [String], default: [] },
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password and delete the confirm
  this.password = await bcrypt.hash(this.password, 12);
  // this.password_confirm = this.password;
  return next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
) {
  const result = await bcrypt.compare(candidatePassword, userPassword);

  return result;
};

const User = mongoose.model('User', userSchema);

export function updateUserAction(
  userId: ObjectId,
  tags: string[],
  board: ObjectId,
) {
  try {
    User.findOne({ _id: userId }).then((doc) => {
      if (doc) {
        const replaceTarget = doc.preference_tags.length - 1;
        const tagsArray: string[] = [];
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
            } else if (preference.name === tag) {
              lessThan30 = false;
            }
          });
          console.log('counting');

          if (ifExist && lessThan30) {
            doc.preference_tags.forEach((preference) => {
              preference.number = +preference.number - ifExist;
            });
            console.log('not adding');
          } else if (ifExist) {
            console.log('nothing');
          } else if (len === 0) {
            doc.preference_tags.push({ name: tag, number: 20 });
          } else if (len < 6) {
            doc.preference_tags.push({ name: tag, number: 0 });
          } else {
            doc.preference_tags[replaceTarget].name = tag;
          }
        });

        if (board) doc.read_board.push(board);
        if (doc.read_board.length > 4) {
          doc.read_board = doc.read_board.slice(1, 5);
        }

        doc.preference_tags.sort((aTag, bTag) => +bTag.number - +aTag.number);

        doc.save();
      }
    });
  } catch (err) {
    console.log(err);
  }
}

export async function updateUserReadPosts(
  userId: ObjectId,
  readPosts: ObjectId[],
) {
  const result = await User.updateOne({ _id: userId }, [
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
}

export async function getUserPreference(userId: ObjectId) {
  try {
    const userInfo = await User.findOne(
      { _id: userId },
      {
        _id: 1,
        preference_tags: 1,
        recommend_mode: 1,
        read_board: 1,
        read_posts: 1,
      },
    );

    return userInfo;
  } catch (err) {
    console.log(err);
    return err;
  }
}

export async function getUserRelationFromDB(user: string, targetId: string) {
  // try {
  const userInfo = await User.findOne(
    {
      _id: user,
      'friends.user': targetId,
    },
    {
      friends: { $elemMatch: { user: targetId } },
    },
  );
  // console.log(userInfo);
  if (userInfo === null) {
    return null;
  }
  return userInfo.friends[0].status;
}

export async function createRelation(user: string, target: string) {
  const session = await User.startSession();
  let result: string;
  try {
    session.startTransaction();
    const relation = await getUserRelationFromDB(user, target);
    if (relation === null) {
      await User.updateOne(
        { _id: user },
        { $push: { friends: { user: target, status: 'requested' } } },
        { session },
      );
      await User.updateOne(
        { _id: target },
        { $push: { friends: { user, status: 'received' } } },
        { session },
      );
      result = 'send';
    } else if (relation === 'received') {
      await User.updateOne(
        { _id: user, 'friends.user': target },
        { $set: { 'friends.$.status': 'friends' } },
        { session },
      );
      await User.updateOne(
        { _id: target, 'friends.user': user },
        { $set: { 'friends.$.status': 'friends' } },
        { session },
      );
      result = 'accept';
    } else {
      result = 'error';
      throw Error('the relationship is neither null nor received');
    }
    await session.commitTransaction();
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    result = 'error';
  } finally {
    await session.endSession();
  }
  return result;
}

export async function cancelRequestFromDB(user: string, target: string) {
  const session = await User.startSession();
  let result;
  try {
    session.startTransaction();
    const relation = await getUserRelationFromDB(user, target);
    if (relation === null) {
      throw Error('the relation does not exist');
    } else if (relation === 'friends') {
      throw Error('friends relation is not request');
    }

    await User.updateOne(
      { _id: user },
      { $pull: { friends: { user: target } } },
      { session },
    );

    await User.updateOne(
      { _id: target },
      { $pull: { friends: { user } } },
      { session },
    );

    await session.commitTransaction();
    result = true;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    result = false;
  } finally {
    await session.endSession();
  }
  return result;
}

export async function addNotificationToUserDB(
  userId: ObjectId,
  category: string,
  actionUser: ObjectId | null,
  targetPost: ObjectId | null,
) {
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

  if (
    category === 'reply_post' ||
    category === 'comment_post' ||
    category === 'upvote_post' ||
    category === 'like_post' ||
    category === 'comment_replied' ||
    category === 'like_comment'
  ) {
    // if notification already exist add to it and make it unread
    const targetNotification = await User.findOne({
      _id: userId,
      notification: {
        $elemMatch: {
          category,
          target_post: targetPost,
        },
      },
    });

    if (targetNotification) {
      await User.updateOne(
        {
          _id: userId,
          notification: {
            $elemMatch: {
              category,
              target_post: targetPost,
            },
          },
        },
        {
          $push: {
            'notification.$.action_users': { $each: [actionUser], $slice: -20 },
          },
          $inc: { 'notification.$.users_num': 1 },
          $set: {
            'notification.$.time': new Date(),
            'notification.$.read': false,
          },
        },
      );

      return 'update';
    }

    // if notification hasn't exist yet, create a new one
    await User.updateOne(
      { _id: userId },
      {
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
      },
    );

    return 'create';
  }

  if (
    category === 'meet_match' ||
    category === 'meet_success' ||
    category === 'meet_fail'
  ) {
    await User.updateOne(
      { _id: userId },
      {
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
      },
    );

    return 'create';
  }

  if (category === 'friend_request' || category === 'request_accepted') {
    await User.updateOne(
      { _id: userId },
      {
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
      },
    );

    return 'create';
  }

  return 'error';
}

export async function getNotificationsFromDB(userId: ObjectId) {
  const userInfo = await User.findOne({ _id: userId });

  if (!userInfo) {
    return false;
  }
  return userInfo.notification;
}

export async function readNotificationsFromDB(userId: ObjectId) {
  const userUpdate = await User.updateOne(
    { _id: userId, 'notification.read': false },
    { $set: { 'notification.$[].read': true } },
  );

  if (userUpdate.acknowledged === false) {
    return false;
  }
  return true;
}

export async function getUserImageFromDB(user: string) {
  const userInfo = await User.findOne({ _id: user }, { image: 1 });

  return userInfo;
}

export async function getUserInfoFromDB(user: string) {
  const userInfo = await User.findOne({ _id: user });

  return userInfo;
}

export async function refuseRequestFromDB(user: string, target: string) {
  const session = await User.startSession();
  let result;
  try {
    session.startTransaction();
    const relation = await getUserRelationFromDB(user, target);
    if (relation === null) {
      throw Error('the relation does not exist');
    } else if (relation !== 'received') {
      throw Error('friends relation is not received');
    }

    await User.updateOne(
      { _id: user },
      { $pull: { friends: { user: target } } },
      { session },
    );

    await User.updateOne(
      { _id: target },
      { $pull: { friends: { user } } },
      { session },
    );

    await session.commitTransaction();
    result = true;
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    result = false;
  } finally {
    await session.endSession();
  }
  return result;
}

export async function getUserFriendsFromDB(user: string) {
  const userInfo = await User.findOne({ _id: user });

  if (!userInfo) {
    return [];
  }

  const friendArray = userInfo.friends.filter(
    (friend) => friend.status === 'friends',
  );

  const returnArray = friendArray.map((el) => el.user);

  return returnArray;
}

export default User;
