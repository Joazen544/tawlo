import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const MESSAGE_PER_PAGE = 20;

interface MessageDocument {
  group: ObjectId;
  from: ObjectId;
  to: ObjectId;
  time: Date;
  is_removed: boolean;
  liked: {
    number: number;
    users: ObjectId[];
  };
}

const messageSchema = new mongoose.Schema<MessageDocument>({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  time: {
    type: Date,
    required: true,
  },
  is_removed: {
    type: Boolean,
    default: false,
  },
  liked: {
    number: Number,
    users: [ObjectId],
  },
});

const Message = mongoose.model('Message', messageSchema);

export async function getLatestMessages(group: ObjectId) {
  const messages = Message.find({ group }).limit(MESSAGE_PER_PAGE);
  return messages;
}

export async function getEarlierMessages(
  group: ObjectId,
  lastMessage: ObjectId,
) {
  const messages = Message.find({ group, _id: { $lt: lastMessage } }).limit(
    MESSAGE_PER_PAGE,
  );
  return messages;
}

export default Message;
