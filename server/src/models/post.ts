import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

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

export default mongoose.model('Post', postSchema);
