import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
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

export default mongoose.model('User', userSchema);
