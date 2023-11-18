import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

interface PostDocument {
  is_delete: boolean;
  category: string;
  title: string;
  publish_date: Date;
  update_date: Date;
  author: ObjectId;
  content: string;
  edit: { date: Date; content: string }[];
  board: { name: string; id: ObjectId };
  mother_post: ObjectId;
  floor: number;
  tags: { id: ObjectId; name: string }[];
  liked: { number: number; users: ObjectId[] };
  sum_likes: number;
  sum_comments: number;
  // userId
  last_reply: ObjectId;
  upvote: { number: number; users: ObjectId[] };
  downvote: { number: number; users: ObjectId[] };
  useful: number;
  comments: {
    number: number;
    data: {
      user: ObjectId;
      content: string;
      time: Date;
      like: {
        number: number;
        users: ObjectId[];
      };
    }[];
  };
  hot: number;
}

const postSchema = new mongoose.Schema<PostDocument>({
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
    type: mongoose.Schema.Types.ObjectId,
    required: true,
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
  // userId
  last_reply: ObjectId,
  //
  upvote: {
    number: Number,
    users: [ObjectId],
  },
  downvote: {
    number: Number,
    users: [ObjectId],
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
