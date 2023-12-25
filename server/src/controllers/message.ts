import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import MessageGroup, {
  getNativeMessageGroupsFromDB,
  updateLatestMessageToGroup,
} from '../models/messageGroup';
import { ValidationError } from '../utils/errorHandler';
import {
  getEarlierMessages,
  getLatestMessages,
  createMessageToDB,
  makeAllMessagesRead,
} from '../models/message';
import catchAsync from '../utils/catchAsync';

import { sendMessageThroughSocket } from './socket';

const getMessagesFromDB = async (
  lastMessage: ObjectId | null,
  messageGroup: ObjectId,
) => {
  let messages;
  if (lastMessage) {
    messages = await getEarlierMessages(messageGroup, lastMessage);
  } else {
    messages = await getLatestMessages(messageGroup);
  }

  return messages;
};

const createMessage = async (group: string, from: string, content: string) => {
  try {
    const time = new Date();
    const groupId = new ObjectId(group);
    const fromId = new ObjectId(from);

    await createMessageToDB(groupId, fromId, content, time);
    await updateLatestMessageToGroup(groupId, fromId, content, time);
  } catch (err) {
    console.log('something goes wrong creating message to DB');
    console.log(err);
    throw new Error('something goes wrong creating message to DB');
  }
};

export const clickChatRoom = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // if user click 'send message to specific user'
    // return the message group info if it exists
    // else create one for them
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
        next(new ValidationError('Target id can not be same with user'));
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
      makeAllMessagesRead(userId, messageGroup._id, messageGroup.last_sender);
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
  },
);

export const getMessageGroups = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req.body;
    const userId = new ObjectId(user);
    const lastGroup = req.query.lastGroup as string;

    let lastGroupId;
    if (lastGroup) {
      lastGroupId = new ObjectId(lastGroup);
    } else {
      lastGroupId = null;
    }

    const messageGroups = await getNativeMessageGroupsFromDB(
      userId,
      lastGroupId,
    );

    if (messageGroups instanceof Error) {
      next(messageGroups);
      return;
    }
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
    res.status(400).json({ error: 'message group does not exist' });
    return;
  }
  makeAllMessagesRead(userId, messageGroup._id, messageGroup.last_sender);
  res.json({ message: 'updated read message' });
});
