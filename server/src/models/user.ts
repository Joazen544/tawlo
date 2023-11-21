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
  chats: [ObjectId],
  upvote: Number,
  downvote: Number,
  honor_now: String,
  honors: [String],
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
        tags.forEach((tag) => {
          let ifExist = 0;
          const len = doc.preference_tags.length;

          doc.preference_tags.forEach((preference) => {
            if (preference.name === tag) {
              preference.number = +preference.number + len;
              ifExist += 1;
            }
          });

          if (ifExist) {
            doc.preference_tags.forEach((preference) => {
              preference.number = +preference.number - ifExist;
            });
          } else if (len === 0) {
            doc.preference_tags.push({ name: tag, number: 20 });
          } else if (len < 6) {
            doc.preference_tags.push({ name: tag, number: 0 });
          } else {
            doc.preference_tags[replaceTarget].name = tag;
          }
        });

        doc.read_board.push(board);
        doc.read_board = doc.read_board.slice(1, 5);

        doc.preference_tags.sort((aTag, bTag) => +bTag.number - +aTag.number);

        doc.save();
      }
    });
  } catch (err) {
    console.log(err);
    throw Error('Something goes wrong updating user action');
  }
}

export async function updateUserReadPosts(
  userId: ObjectId,
  readPosts: ObjectId[],
) {
  console.log('~~~');

  await User.updateOne({ _id: userId }, [
    {
      $set: {
        read_posts: {
          $concatArrays: ['$read_posts', readPosts],
        },
      },
    },
  ]);
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
