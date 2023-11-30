import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

interface FriendRequestDocument extends Document {
  _id: ObjectId;
  users: ObjectId[];
  requester: ObjectId;
  recipient: ObjectId;
  status: string;
  time: Date;
}

const friendRequestSchema = new mongoose.Schema<FriendRequestDocument>({
  users: {
    type: [ObjectId],
    required: [true, 'Users must contain two different users'],
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  status: {
    type: String,
    enum: ['no', 'requested', 'pending', 'friends'],
  },
  time: {
    type: Date,
    default: Date.now,
  },
});

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

export default FriendRequest;
