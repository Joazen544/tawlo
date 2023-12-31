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
  preference_tags: { name: string; number: number }[];
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

export const userSchema = new mongoose.Schema<UserDocument>({
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

interface Tag {
  name: string;
  number: number;
}

export const updateReadBoards = (readBoards: ObjectId[], board: ObjectId) => {
  readBoards.push(board);
  return readBoards.length > 4 ? readBoards.slice(1, 5) : readBoards;
};

export const adjustOldPreferenceTagsScore = (
  originalTags: Tag[],
  tags: string[],
  TAG_LARGEST_POINT: number,
) => {
  const newTagsArray: string[] = [];

  tags.forEach((tag) => {
    let ifExist = 0;
    let ifScoreLessThanLargestPoint;
    const userPreferenceLength = originalTags.length;

    originalTags.forEach((preference) => {
      if (preference.name === tag && +preference.number <= TAG_LARGEST_POINT) {
        preference.number = +preference.number + userPreferenceLength;
        ifExist += 1;
        ifScoreLessThanLargestPoint = true;
      } else if (preference.name === tag) {
        ifExist += 1;
        ifScoreLessThanLargestPoint = false;
      }
    });

    if (ifExist) {
      if (ifScoreLessThanLargestPoint) {
        originalTags.forEach((preference) => {
          preference.number = +preference.number - ifExist;
        });
      }
    } else if (originalTags.length === 0) {
      originalTags.push({ name: tag, number: 20 });
    } else if (originalTags.length < 10) {
      originalTags.push({ name: tag, number: 0 });
    } else {
      newTagsArray.push(tag);
    }
  });

  return { originalArray: originalTags, newTags: newTagsArray };
};

export const addNewTagsToPreference = (
  originalSortedTags: Tag[],
  newTags: string[],
  REPLACE_TAG_TARGET: number,
) => {
  const newTagsArray: (string | undefined)[] = newTags;
  if (newTags.length > 0) {
    newTags.forEach((tag, index) => {
      for (
        let i = REPLACE_TAG_TARGET + 1;
        i < originalSortedTags.length;
        i += 1
      ) {
        if (tag === originalSortedTags[i].name) {
          originalSortedTags[REPLACE_TAG_TARGET].name =
            originalSortedTags[i].name;
          newTagsArray[index] = undefined;
        }
      }
    });

    // const newPreferenceTags = originalSortedTags.slice(
    //   0,
    //   10 - newTagsArray.length,
    // );

    let count = 0;
    newTagsArray.forEach((tag) => {
      if (tag !== undefined) {
        originalSortedTags[REPLACE_TAG_TARGET + 1 + count].name = tag;
        count += 1;
      }
    });

    return originalSortedTags;
  }
  return originalSortedTags;
};

export const sortOriginalTags = (oldTagsScoreAdjusted: Tag[]) => {
  return oldTagsScoreAdjusted.sort((aTag, bTag) => +bTag.number - +aTag.number);
};

export async function updateUserAction(
  userId: ObjectId,
  tags: string[],
  board: ObjectId,
) {
  const REPLACE_TAG_TARGET = 5;
  const TAG_LARGEST_POINT = 30;

  const userData = await User.findOne({ _id: userId });

  if (!userData) {
    throw new Error('user does not exist');
  }

  const preferenceTags = userData.preference_tags;

  if (!preferenceTags) {
    throw new Error('user preference does not exist');
  }

  const { originalArray, newTags } = adjustOldPreferenceTagsScore(
    preferenceTags,
    tags,
    TAG_LARGEST_POINT,
  );

  const preferenceTagsSorted = sortOriginalTags(originalArray);

  const preferenceTagsAddingNew = addNewTagsToPreference(
    preferenceTagsSorted,
    newTags,
    REPLACE_TAG_TARGET,
  );

  const newReadBoards = updateReadBoards(userData.read_board, board);

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        preference_tags: preferenceTagsAddingNew,
        read_board: newReadBoards,
      },
    },
  );
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

export async function getUserRelation(user: string, targetId: string) {
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
    const relation = await getUserRelation(user, target);
    if (relation === null) {
      await User.updateOne(
        { _id: user },
        { $push: { friends: { user: target, status: 'requested' } } },
      ).session(session);
      await User.updateOne(
        { _id: target },
        { $push: { friends: { user, status: 'received' } } },
      ).session(session);
      result = 'send';
    } else if (relation === 'received') {
      await User.updateOne(
        { _id: user, 'friends.user': target },
        { $set: { 'friends.$.status': 'friends' } },
      ).session(session);
      await User.updateOne(
        { _id: target, 'friends.user': user },
        { $set: { 'friends.$.status': 'friends' } },
      ).session(session);
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

export async function cancelRequest(user: string, target: string) {
  const session = await User.startSession();
  let result;
  try {
    session.startTransaction();
    const relation = await getUserRelation(user, target);
    if (relation === null) {
      throw Error('the relation does not exist');
    } else if (relation === 'friends') {
      throw Error('friends relation is not request');
    }

    await User.updateOne(
      { _id: user },
      { $pull: { friends: { user: target } } },
    ).session(session);

    await User.updateOne(
      { _id: target },
      { $pull: { friends: { user } } },
    ).session(session);

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

export async function addNotification(
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

export async function getNotifications(userId: ObjectId) {
  const userInfo = await User.findOne({ _id: userId });

  if (!userInfo) {
    return false;
  }
  return userInfo.notification;
}

export async function readNotifications(userId: ObjectId) {
  const userUpdate = await User.updateOne(
    { _id: userId, 'notification.read': false },
    { $set: { 'notification.$[].read': true } },
  );

  if (userUpdate.acknowledged === false) {
    return false;
  }
  return true;
}

export async function getUserImage(user: string) {
  const userInfo = await User.findOne({ _id: user }, { image: 1 });

  return userInfo;
}

export async function getUserInfo(user: string) {
  const userInfo = await User.findOne({ _id: user });

  return userInfo;
}

export async function refuseRequest(user: string, target: string) {
  const session = await User.startSession();
  let result;
  try {
    session.startTransaction();
    const relation = await getUserRelation(user, target);
    if (relation === null) {
      throw Error('the relation does not exist');
    } else if (relation !== 'received') {
      throw Error('friends relation is not received');
    }

    await User.updateOne(
      { _id: user },
      { $pull: { friends: { user: target } } },
    ).session(session);

    await User.updateOne(
      { _id: target },
      { $pull: { friends: { user } } },
    ).session(session);

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

export async function getUserFriends(user: string) {
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

export async function findUserPreference(user: string) {
  const userInfo = await User.findOne({ _id: user }, { preference_tags: 1 });
  return userInfo?.preference_tags;
}

export default User;
