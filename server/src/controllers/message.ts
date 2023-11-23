import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import MessageGroup, {
  getNativeMessageGroupsFromDB,
} from '../models/messageGroup';
import { ValidationError } from '../utils/errorHandler';
import { getEarlierMessages, getLatestMessages } from '../models/message';

async function getMessagesFromDB(
  lastMessage: ObjectId | null,
  messageGroup: ObjectId,
) {
  let messages;
  if (lastMessage) {
    messages = await getEarlierMessages(messageGroup, lastMessage);
  } else {
    messages = await getLatestMessages(messageGroup);
  }

  return messages;
}

export async function getMessageGroup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // if user click 'send message to specific user'
  // return the message group info if it exists
  // else create one for them
  try {
    const { user } = req.body;
    const id = req.query.id as string;

    const userId = new ObjectId(user);

    let targetId;
    if (id) {
      targetId = new ObjectId(id);
    } else {
      next(new ValidationError('Target user id should be included in query'));
    }

    if (userId === targetId) {
      next(new ValidationError('Target id can not be same with user'));
    }

    const messageGroup = await MessageGroup.findOne({
      users: { $all: [userId, targetId] },
    });

    console.log(messageGroup);

    if (messageGroup !== null) {
      console.log(messageGroup);

      const messages = await getMessagesFromDB(null, messageGroup._id);
      res.json({
        groupId: messageGroup._id,
        users: messageGroup.users,
        category: messageGroup.category,
        messages,
      });
      return;
    }

    const messageGroupCreated = await MessageGroup.create({
      users: [userId, targetId],
      category: 'native',
      start_time: new Date(),
      update_time: new Date(),
      last_message: 'No message yet',
    });

    console.log(messageGroupCreated);

    res.json({
      groupId: messageGroupCreated._id,
      users: messageGroupCreated.users,
      category: messageGroupCreated.category,
      messages: [],
    });
  } catch (err) {
    next(err);
  }
}

export async function getNativeMessageGroups(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
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
  } catch (err) {
    next(err);
  }
}

export async function getMessage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const group = req.query.group as string;
    const lastMessage = req.query.lastMessage as string;
    const groupId = new ObjectId(group);
    let lastMessageId;
    if (lastMessage) {
      lastMessageId = new ObjectId(lastMessage);
    } else {
      lastMessageId = null;
    }

    const messages = await getMessagesFromDB(lastMessageId, groupId);

    res.json({ messages });
  } catch (err) {
    next(err);
  }
}
