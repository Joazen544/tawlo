import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import validator from 'validator';
import bcrypt from 'bcrypt';

interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  password_confirm: string;
  read_posts: ObjectId[];
  friends: ObjectId[];
  follow: ObjectId[];
  block: ObjectId[];
  read_board: ObjectId[];
  preference_tags: { id: ObjectId; number: Number }[];
  chats: ObjectId[];
  upvote: number;
  downvote: number;
  honor_now: { name: string; id: ObjectId };
  honors: { name: string; id: ObjectId }[];
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
  },
  password_confirm: {
    type: String || undefined,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on SAVE!!!
      validator(this: UserDocument, el: String) {
        return el === this.password;
      },
      message: 'Password are not the same',
    },
  },
  // Posts read 300 recorded
  read_posts: [ObjectId],
  friends: [ObjectId],
  follow: [ObjectId],
  block: [ObjectId],
  // only record 5 board
  // or native board
  read_board: [ObjectId],
  preference_tags: [
    // record 5 tags
    // index 0 is the favorite, index 4 is soso
    {
      id: ObjectId,
      number: Number,
    },
  ],
  // chat rooms
  chats: [ObjectId],
  upvote: Number,
  downvote: Number,
  honor_now: {
    name: String,
    id: ObjectId,
  },
  honors: [
    {
      name: String,
      id: ObjectId,
    },
  ],
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password and delete the confirm
  this.password = await bcrypt.hash(this.password, 12);

  this.password_confirm = 'confirm';
  return next();
});

export default mongoose.model<UserDocument>('User', userSchema);
