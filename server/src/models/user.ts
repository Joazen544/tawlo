import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import validator from 'validator';
import bcrypt from 'bcrypt';

export interface UserDocument extends Document {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  // password_confirm: string;
  read_posts: ObjectId[];
  friends: ObjectId[];
  friend_requests: { send: ObjectId; to: ObjectId }[];
  follow: ObjectId[];
  block: ObjectId[];
  read_board: ObjectId[];
  preference_tags: { name: string; number: Number }[];
  recommend_mode: string;
  chats: ObjectId[];
  upvote: number;
  downvote: number;
  honor_now: string;
  honors: string[];
  correctPassword: (arg1: string, arg2: string) => Boolean;
}

const userSchema = new mongoose.Schema<UserDocument>({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
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

  // Posts read 300 recorded
  read_posts: [ObjectId],
  friends: [ObjectId],
  friend_requests: [{ send: ObjectId, to: ObjectId }],
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
    default: [],
  },
  recommend_mode: {
    type: String,
    default: 'auto',
    enum: ['auto', 'customize', 'time', 'hot'],
  },
  // chat rooms
  chats: { type: [ObjectId], default: [] },
  upvote: { type: Number, default: 0 },
  downvote: { type: Number, default: 0 },
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
        console.log(tags);

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

          if (ifExist && lessThan30) {
            doc.preference_tags.forEach((preference) => {
              preference.number = +preference.number - ifExist;
            });
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
          $slice: [{ $concatArrays: ['$read_posts', readPosts] }, -30],
        },
      },
    },
  ]);

  if (result.acknowledged !== true) {
    console.log('Something is wrong updating user read posts');
  }
}

export async function getUserPreference(userId: ObjectId) {
  const userInfo = User.findOne(
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
}

export default User;
