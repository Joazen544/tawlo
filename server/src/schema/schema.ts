import { ObjectId, Timestamp } from 'mongodb';
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  is_delete: {
    type: Boolean,
    required: true,
  },
  category: {
    // native || board || reply
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  publish_date: {
    type: Date,
    required: true,
  },
  update_date: Date,
  author: {
    _id: { type: ObjectId, required: true },
  },
  content: {
    type: String,
    required: true,
  },
  edit: [
    {
      date: Date,
      content: String,
    },
  ],
  board: {
    name: String,
    id: ObjectId,
  },
  mother_post: ObjectId,
  floor: Number,
  tags:
    // 3 tags the most
    [
      {
        id: ObjectId,
        name: String,
      },
    ],
  liked: {
    number: Number,
    users: [ObjectId],
  },
  // only on mother post
  sum_likes: Number,
  sum_comments: Number,
  last_reply: ObjectId,
  //
  upvote: {
    number: Number,
    users: [ObjectId],
  },
  downvote: {
    number: Number,
    users: {
      type: [ObjectId],
    },
  },
  useful: Number,
  comments: {
    number: Number,
    data: [
      {
        user: ObjectId,
        content: String,
        time: Date,
        like: {
          number: Number,
          users: [ObjectId],
        },
      },
    ],
  },
  hot: Number,
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: true,
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

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  admin: ObjectId,
});

const messageGroupSchema = new mongoose.Schema({
  users: [ObjectId],
});

const messageSchema = new mongoose.Schema({
  group: ObjectId,
  from: ObjectId,
  to: ObjectId,
  time: Timestamp,
  is_removed: Boolean,
});

export const Post = mongoose.model('Post', postSchema);
export const User = mongoose.model('User', userSchema);
export const Board = mongoose.model('Board', boardSchema);
export const MessageGroup = mongoose.model('MessageGroup', messageGroupSchema);
export const Message = mongoose.model('Message', messageSchema);
