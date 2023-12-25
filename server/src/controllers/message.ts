import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import MessageGroup, * as messageGroupModel from '../models/messageGroup';
import { ValidationError } from '../utils/errorHandler';
import * as messageModel from '../models/message';
import catchAsync from '../utils/catchAsync';

import { sendMessageThroughSocket } from './socket';

const getMessagesFromDB = async (
  lastMessage: ObjectId | null,
  messageGroup: ObjectId,
) => {
  const messages = lastMessage
    ? await messageModel.getEarlierMessages(messageGroup, lastMessage)
    : await messageModel.getLatestMessages(messageGroup);

  return messages;
};

const createMessage = async (group: string, from: string, content: string) => {
  try {
    const time = new Date();
    const groupId = new ObjectId(group);
    const fromId = new ObjectId(from);

    await messageModel.createMessage(groupId, fromId, content, time);
    await messageGroupModel.updateLatestMessageToGroup(
      groupId,
      fromId,
      content,
      time,
    );
  } catch (err) {
    console.log('something goes wrong creating message to DB');
    console.log(err);
    throw new Error('something goes wrong creating message to DB');
  }
};

export const clickChatRoom = catchAsync(async (req: Request, res: Response) => {
  const { user } = req.body;
  const target = req.query.target as string;
  const group = req.query.group as string;

  if (!target && !group) {
    throw new ValidationError(
      'There must be target user id or chat room id in the query',
    );
  }

  const userId = new ObjectId(user);

  let targetId;
  let messageGroup;
  if (target) {
    targetId = new ObjectId(target);

    if (user === target) {
      throw new ValidationError('Target id can not be same with user');
    }

    messageGroup = await MessageGroup.findOne({
      users: { $all: [userId, targetId] },
    });

    if (messageGroup === null) {
      const messageGroupCreated = await MessageGroup.create({
        users: [userId, targetId],
        category: 'native',
        start_time: new Date(),
        update_time: new Date(),
        last_message: 'No message yet',
      });

      res.json({
        situation: 'second',
        groupId: messageGroupCreated._id,
        users: messageGroupCreated.users,
        category: messageGroupCreated.category,
        messages: [],
      });
      return;
    }
  } else {
    const groupId = new ObjectId(group);

    messageGroup = await MessageGroup.findOne({
      _id: groupId,
    });
  }

  if (messageGroup === null) {
    throw new ValidationError('This chat room does not exist');
  }

  try {
    messageModel.makeAllMessagesRead(
      userId,
      messageGroup._id,
      messageGroup.last_sender,
    );
  } catch (err) {
    console.log('something is wrong making messages read');
  }

  const messages = await getMessagesFromDB(null, messageGroup._id);
  const messagesNotRemoved = messages.map((message) => {
    if (message.is_removed === false) {
      return message;
    }
    message.content = 'This message was removed';
    return message;
  });
  res.json({
    situation: 'second',
    groupId: messageGroup._id,
    users: messageGroup.users,
    category: messageGroup.category,
    messages: messagesNotRemoved,
  });
});

export const getMessageGroups = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = req.body;
    const userId = new ObjectId(user);
    const lastGroup = req.query.lastGroup as string;

    let lastGroupId;
    if (lastGroup) {
      lastGroupId = new ObjectId(lastGroup);
    } else {
      lastGroupId = null;
    }

    const messageGroups = await messageGroupModel.getNativeMessageGroups(
      userId,
      lastGroupId,
    );

    messageGroups.forEach((group) => {
      group.users = group.users.filter(
        (target) => target.toString() !== userId.toString(),
      );
      if (group.users.length === 0) {
        group.users.push(userId);
      }
    });

    res.json({
      messageGroups,
    });
  },
);

export const getMoreMessages = catchAsync(
  async (req: Request, res: Response) => {
    const group = req.query.group as string;
    if (!group) {
      throw new ValidationError('Last message read id should be in query');
    }
    const lastMessage = req.query.lastMessage as string;
    const groupId = new ObjectId(group);
    let lastMessageId;
    if (lastMessage) {
      lastMessageId = new ObjectId(lastMessage);
    } else {
      throw new ValidationError('Last message read id should be in query');
    }

    const messages = await getMessagesFromDB(lastMessageId, groupId);

    res.json({ messages });
  },
);

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { user, messageTo, messageGroup, content } = req.body;

  await createMessage(messageGroup, user, content);

  sendMessageThroughSocket(user, content, messageTo, messageGroup);

  res.json({ message: 'message sent' });
});

export const readMessages = catchAsync(async (req: Request, res: Response) => {
  const { user, messageGroupId } = req.body;
  const userId = new ObjectId(user);
  const messageGroup = await MessageGroup.findOne({ _id: messageGroupId });
  if (!messageGroup) {
    throw new ValidationError('message group does not exist');
  }
  messageModel.makeAllMessagesRead(
    userId,
    messageGroup._id,
    messageGroup.last_sender,
  );
  res.json({ message: 'updated read message' });
});
