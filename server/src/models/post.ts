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
  reply_floor: number;
  tags: { _id: ObjectId; name: string }[];
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
    default: false,
    required: true,
  },
  category: {
    // native || mother || reply
    type: String,
    enum: ['native', 'mother', 'reply'],
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
  reply_floor: Number,
  tags:
    // 3 tags the most
    [
      {
        _id: ObjectId,
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

postSchema.pre('save', async function (next) {
  this.publish_date = new Date();
  console.log('publish date!!!');

  console.log(this.publish_date);

  next();
});

export default mongoose.model('Post', postSchema);
