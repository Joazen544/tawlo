import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const MESSAGE_PER_PAGE = 20;

interface MessageDocument {
  group: ObjectId;
  from: ObjectId;
  content: string;
  time: Date;
  is_removed: boolean;
  liked: {
    number: number;
    users: ObjectId[];
  };
  read: ObjectId[];
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
  content: {
    type: String,
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
    number: { type: Number, default: 0 },
    users: { type: [ObjectId], default: [] },
  },
  read: [ObjectId],
});

const Message = mongoose.model('Message', messageSchema);

export async function getLatestMessages(group: ObjectId) {
  const messages = await Message.find({ group })
    .sort({ _id: -1 })
    .limit(MESSAGE_PER_PAGE);

  const returnMessages = messages.reverse();

  return returnMessages;
}

export async function getEarlierMessages(
  group: ObjectId,
  lastMessage: ObjectId,
) {
  const messages = await Message.find({ group, _id: { $lt: lastMessage } })
    .sort({ _id: -1 })
    .limit(MESSAGE_PER_PAGE);

  const returnMessages = messages.reverse();

  return returnMessages;
}

export async function createMessageToDB(
  group: ObjectId,
  from: ObjectId,
  content: string,
  time: Date,
) {
  const result = await Message.create({
    group,
    from,
    time,
    content,
  });

  console.log('create message to DB result');
  console.log(result);

  return result;
}

export async function makeAllMessagesRead(
  userId: ObjectId,
  messageGroupId: ObjectId,
) {
  await Message.updateMany(
    { group: messageGroupId, read: { $ne: userId } },
    { $push: { read: userId } },
  );
}

export default Message;
