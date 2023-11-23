import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const GROUPS_PER_PAGE = 10;

interface MessageGroupDocument {
  users: ObjectId[];
  category: string;
  start_time: Date;
  update_time: Date;
  last_sender: ObjectId;
  last_message: string;
}

const messageGroupSchema = new mongoose.Schema<MessageGroupDocument>({
  users: {
    type: [ObjectId],
    required: true,
  },
  category: {
    type: String,
    enum: ['native', 'explore'],
    required: true,
  },
  start_time: {
    type: Date,
    required: true,
  },
  update_time: {
    type: Date,
    required: true,
  },
  last_sender: ObjectId,
  last_message: {
    type: String,
    required: true,
  },
});

const MessageGroup = mongoose.model('MessageGroup', messageGroupSchema);

export async function getNativeMessageGroupsFromDB(
  userId: ObjectId,
  lastGroup: ObjectId | null,
) {
  let groups;
  if (lastGroup) {
    groups = MessageGroup.find({
      users: userId,
      _id: { $lt: lastGroup },
      category: 'native',
    }).limit(GROUPS_PER_PAGE);
  } else {
    groups = MessageGroup.find({
      users: userId,
      category: 'native',
    }).limit(GROUPS_PER_PAGE);
  }

  return groups;
}

export default MessageGroup;
