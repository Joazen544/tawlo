import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import MessageGroup from './messageGroup';

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

export async function createMessage(
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
    read: [from],
  });
  // console.log('~~~~');

  return result;
}

export async function makeAllMessagesRead(
  userId: ObjectId,
  messageGroupId: ObjectId,
  last_sender: ObjectId,
) {
  try {
    await Message.updateMany(
      { group: messageGroupId, read: { $ne: userId } },
      { $push: { read: userId } },
    );
    // console.log('making');

    if (last_sender !== userId) {
      // console.log('making 2');
      // console.log(messageGroupId);

      await MessageGroup.updateOne({ _id: messageGroupId }, { unread: 0 });
    }
  } catch (err) {
    console.log(err);
    console.log('something is wrong making messages read');
  }
}

export default Message;
