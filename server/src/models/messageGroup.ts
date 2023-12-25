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
  unread: number;
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
  unread: {
    type: Number,
    default: 0,
  },
});

const MessageGroup = mongoose.model('MessageGroup', messageGroupSchema);

export async function getNativeMessageGroups(
  userId: ObjectId,
  lastGroup: ObjectId | null,
) {
  let groups;
  if (lastGroup) {
    const lastGroupInfo = await MessageGroup.findOne({ _id: lastGroup });
    if (!lastGroupInfo) {
      throw Error('last message group does not exist');
    }
    const lastGroupUpdateTime = lastGroupInfo.update_time;
    groups = await MessageGroup.find({
      users: userId,
      update_time: { $gt: lastGroupUpdateTime },
      category: 'native',
    })
      .sort({ update_time: -1 })
      .limit(GROUPS_PER_PAGE);
  } else {
    groups = MessageGroup.find({
      users: userId,
      category: 'native',
    })
      .sort({ update_time: -1 })
      .limit(GROUPS_PER_PAGE);
  }

  return groups;
}

export async function updateLatestMessageToGroup(
  group: ObjectId,
  lastUser: ObjectId,
  lastMessage: string,
  updateTime: Date,
) {
  await MessageGroup.updateOne(
    { _id: group },
    {
      last_sender: lastUser,
      update_time: updateTime,
      last_message: lastMessage,
      $inc: { unread: 1 },
    },
  );
}

export default MessageGroup;
