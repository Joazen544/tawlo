import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Meeting, * as meetingModel from '../models/meeting';
import { sendNotificationThroughSocket } from './socket';
import User, { UserDocument, addNotification } from '../models/user';
import { ValidationError } from '../utils/errorHandler';
import catchAsync from '../utils/catchAsync';

export const accessMeeting = catchAsync(async (req: Request, res: Response) => {
  const { user, role, userIntro, toShare, toAsk } = req.body;
  if (!role || !userIntro || !toShare || !toAsk) {
    throw new ValidationError('role, user info, to share, to ask needed');
  }

  const userMeetingInfo = await User.findOne(
    { _id: user },
    { met_users: 1, rating: 1, meeting_comments: 1, meeting_status: 1 },
  );

  if (!userMeetingInfo) {
    throw new Error('user not found');
  }

  if (userMeetingInfo.meeting_status === 'end') {
    throw new Error('user should give last meeting a score first');
  }

  if (userMeetingInfo.meeting_status !== 'none') {
    throw new Error('user already has a meeting');
  }

  const metUsers = userMeetingInfo.met_users || [];
  const meetingComments = userMeetingInfo.meeting_comments || [];
  const { rating } = userMeetingInfo;

  if (!rating) {
    throw new Error('user does not have rating property');
  }

  const joinResult = await meetingModel.joinMeeting(
    metUsers,
    user,
    role,
    rating,
    meetingComments,
    userIntro,
    toShare,
    toAsk,
  );

  if (joinResult) {
    try {
      await User.updateOne(
        { _id: joinResult.users[0] },
        {
          meeting: joinResult._id,
          meeting_status: 'checking',
          $push: { met_users: user },
        },
      );

      addNotification(joinResult.users[0], 'meet_match', null, null);

      sendNotificationThroughSocket(
        joinResult.users[0].toString(),
        'meet_match',
        '配對成功，看看對方的資訊吧',
        undefined,
        undefined,
      );

      await User.updateOne(
        { _id: user },
        {
          meeting: joinResult._id,
          meeting_status: 'checking',
          $push: { met_users: joinResult.users[0] },
        },
      );
    } catch (err) {
      throw new Error(
        `something wrong updating meeting info for users: ${err}`,
      );
    }

    res.json({
      message: 'join meeting sucess, wait for checking',
      joinResult,
    });
    return;
  }
  // else, no meeting to join: create a new one

  const createMeetingResult = await meetingModel.createMeeting(
    user,
    role,
    rating,
    meetingComments,
    userIntro,
    toShare,
    toAsk,
  );

  await User.updateOne(
    { _id: user },
    { meeting: createMeetingResult._id, meeting_status: 'pending' },
  );

  res.json({
    status: 'No meeting to join, created meeting',
    meetingId: createMeetingResult._id,
  });
});

export const getMeeting = catchAsync(async (req: Request, res: Response) => {
  const { user } = req.body;

  const userId = new ObjectId(user);

  const [meetingInfo] = await User.aggregate([
    { $match: { _id: userId } },
    {
      $lookup: {
        from: 'meetings',
        localField: 'meeting',
        foreignField: '_id',
        as: 'meeting',
      },
    },
    { $project: { meeting: 1, meeting_status: 1 } },
  ]);

  if (meetingInfo && meetingInfo.meeting_status === 'none') {
    res.json({ status: 'none', message: 'no meeting now' });
    return;
  }

  // console.log(JSON.stringify(meetingInfo, null, 4));

  let targetIndex: number = -1;
  let userIndex: number = -1;

  if (!meetingInfo.meeting[0]) {
    res.status(400).json({ error: 'the meeting does not exist' });
    return;
  }

  const [meeting] = meetingInfo.meeting;

  meeting.users.forEach((userInfo: ObjectId, index: number) => {
    if (userInfo.toString() === user) {
      userIndex = index;
    } else {
      targetIndex = index;
    }
  });

  if (meetingInfo.meeting_status === 'pending') {
    res.json({
      _id: meetingInfo._id,
      status: meetingInfo.meeting_status,
      meeting: {
        _id: meeting._id,
        status: meeting.status,
        user: {
          userId: meeting.users[0],
          role: meeting.role[0],
          user_intro: meeting.user_intro[0],
          rating: Math.round(meeting.ratings[0] * 10) / 10,
          meeting_comment: meeting.meeting_comments[0],
          to_share: meeting.to_share[0],
          to_ask: meeting.to_ask[0],
        },
      },
    });
    return;
  }

  if (userIndex >= 0 && targetIndex >= 0) {
    res.json({
      _id: meetingInfo._id,
      status: meetingInfo.meeting_status,
      meeting: {
        _id: meeting._id,
        status: meeting.status,
        user: {
          userId: meeting.users[userIndex],
          role: meeting.role[userIndex],
          user_intro: meeting.user_intro[userIndex],
          rating: Math.round(meeting.ratings[userIndex] * 10) / 10,
          meeting_comment: meeting.meeting_comments[userIndex],
          to_share: meeting.to_share[userIndex],
          to_ask: meeting.to_ask[userIndex],
        },
        target: {
          userId: meeting.users[targetIndex],
          role: meeting.role[targetIndex],
          user_intro: meeting.user_intro[targetIndex],
          rating: Math.round(meeting.ratings[targetIndex] * 10) / 10,
          meeting_comment: meeting.meeting_comments[targetIndex],
          to_share: meeting.to_share[targetIndex],
          to_ask: meeting.to_ask[targetIndex],
        },
      },
    });
    return;
  }

  res.status(500).json({ error: 'something is wrong getting meeting info' });
});

export const replyMeeting = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user, reply } = req.body;
    const { meetingId } = req.params;

    if (!reply || !meetingId) {
      throw new ValidationError('reply and meetingId needed');
    }

    if (!['accept', 'deny'].includes(reply)) {
      throw new ValidationError('reply must be accept or deny');
    }

    const meeting = await Meeting.findOne<meetingModel.MeetingDocument>({
      _id: meetingId,
    });

    if (!meeting) {
      throw new ValidationError('meeting does not exist');
    }

    if (!meeting.users.includes(user)) {
      throw new ValidationError('meeting does not include this user');
    }

    if (meeting.status !== 'checking') {
      throw new ValidationError('the meeting is not checking');
    }

    if (reply === 'accept') {
      // update the status of users, meeting to meeting
      // create a chat room for them
      // notificate them
      if (!meeting.accept[0]) {
        // the other one has not accepted yet
        await Meeting.updateOne(
          { _id: meetingId },
          { $push: { accept: user } },
        );

        await User.updateOne(
          { _id: user },
          { $set: { meeting_status: 'waiting' } },
        );
        res.json({
          situation: 'first',
          message: 'accept success, waiting for another user to accept',
        });
        return;
      }
      // both users accept

      await Meeting.updateOne(
        { _id: meetingId },
        { $push: { accept: user }, $set: { status: 'end' } },
      );

      await User.updateMany(
        { _id: meeting.users },
        { $set: { meeting_status: 'end' } },
      );

      addNotification(meeting.users[0], 'meet_success', null, null);
      addNotification(meeting.users[1], 'meet_success', null, null);

      sendNotificationThroughSocket(
        meeting.users[0].toString(),
        'meet_success',
        '雙方都接受配對了，來跟對方聯絡吧！',
        undefined,
        undefined,
      );

      sendNotificationThroughSocket(
        meeting.users[1].toString(),
        'meet_success',
        '雙方都接受配對了，來跟對方聯絡吧！',
        undefined,
        undefined,
      );

      // open a chat for them
      req.query.target = meeting.accept[0].toString();

      next();
      return;
    }

    // make the meeting fail and find new meetings for both users

    await Meeting.updateOne({ _id: meetingId }, { $set: { status: 'fail' } });

    meeting.users.forEach(async (userId: ObjectId, index: number) => {
      const metUsersInfo = await User.findOne(
        { _id: userId },
        { met_users: 1, rating: 1, meeting_status: 1 },
      );

      if (!metUsersInfo) {
        throw new Error('can not find user while updating meeting');
      }

      const metUsers = metUsersInfo.met_users || [];

      const joinResult = await meetingModel.joinMeeting(
        metUsers,
        userId.toString(),
        meeting.role[index],
        meeting.ratings[index],
        meeting.meeting_comments[index],
        meeting.user_intro[index],
        meeting.to_share[index],
        meeting.to_ask[index],
      );

      if (joinResult) {
        // joined a meeting
        // send notification to both users

        try {
          await User.updateOne(
            { _id: joinResult.users[0] },
            {
              meeting: joinResult._id,
              meeting_status: 'checking',
              $push: { met_users: userId },
            },
          );

          await User.updateOne(
            { _id: userId },
            {
              meeting: joinResult._id,
              meeting_status: 'checking',
              $push: { met_users: joinResult.users[0] },
            },
          );

          addNotification(joinResult.users[0], 'meet_match', null, null);
          addNotification(userId, 'meet_match', null, null);

          sendNotificationThroughSocket(
            joinResult.users[0].toString(),
            'meet_match',
            '配對成功，看看對方的資訊吧',
            undefined,
            undefined,
          );

          sendNotificationThroughSocket(
            userId.toString(),
            'meet_match',
            '配對成功，看看對方的資訊吧',
            undefined,
            undefined,
          );
        } catch (err) {
          throw new Error(
            `something wrong updating meeting info for users: ${err}`,
          );
        }
      } else {
        // else, if false: create a new one

        const createResult = await meetingModel.createMeeting(
          userId.toString(),
          meeting.role[index],
          meeting.ratings[index],
          meeting.meeting_comments[index],
          meeting.user_intro[index],
          meeting.to_share[index],
          meeting.to_ask[index],
        );

        addNotification(userId, 'meet_fail', null, null);

        await User.updateOne(
          { _id: userId },
          { meeting: createResult._id, meeting_status: 'pending' },
        );

        sendNotificationThroughSocket(
          userId.toString(),
          'meet_fail',
          '配對失敗，自動重新配對',
          undefined,
          undefined,
        );
      }
    });
    res.json({ message: 'create or join new meeting for users' });
  },
);

export const scoreMeeting = catchAsync(async (req: Request, res: Response) => {
  const { user, score, targetUser, comment } = req.body;
  const { meetingId } = req.params;
  if (!comment) {
    throw new ValidationError('comment is needed');
  }
  if (!score) {
    throw new ValidationError('score is needed');
  }

  if (typeof score !== 'number') {
    throw new ValidationError('score is not number');
  }

  const meeting = await Meeting.findOne({ _id: meetingId });

  if (!meeting) {
    throw new ValidationError('meeting does not exist');
  }

  if (!meeting.users.includes(user)) {
    throw new ValidationError('meeting does not include this user');
  }

  if (!meeting.users.includes(targetUser)) {
    throw new ValidationError('meeting does not include target user');
  }

  const userInfo = await User.findOne<UserDocument>({ _id: targetUser });
  if (!userInfo) {
    throw new ValidationError('user does not exist');
  }
  const { rating } = userInfo;
  const ratingNumber = userInfo.rating_number;
  const newRatingNumber = ratingNumber + 1;
  const newRating = (rating * ratingNumber + score) / newRatingNumber;

  await User.updateOne(
    { _id: targetUser },
    {
      $set: {
        rating: newRating,
        rating_number: newRatingNumber,
      },
      $push: { meeting_comments: comment },
    },
  );

  await User.updateOne({ _id: user }, { $set: { meeting_status: 'none' } });

  res.json({ message: 'scored last meeting, can now create new meeting' });
});

export const cancelMeeting = catchAsync(async (req: Request, res: Response) => {
  const { user } = req.body;
  const userMeetingInfo = await User.findOne(
    { _id: user },
    { meeting_status: 1, meeting: 1 },
  );

  if (!userMeetingInfo) {
    throw new ValidationError('user does not exist');
    return;
  }

  if (userMeetingInfo.meeting_status !== 'pending') {
    throw new ValidationError('user can only cancel pending meeting');
  }

  await Meeting.updateOne({ _id: userMeetingInfo.meeting }, { status: 'fail' });

  await User.updateOne({ _id: user }, { $set: { meeting_status: 'none' } });

  res.json({ message: 'cancel meeting success' });
});

export const getSharings = catchAsync(async (req: Request, res: Response) => {
  const search = req.query.search as string;

  if (!search) {
    throw new ValidationError('no search words');
  }

  const tags = await meetingModel.getSharings(search);

  res.json(tags);
});

export const getAskings = catchAsync(async (req: Request, res: Response) => {
  const search = req.query.search as string;

  if (!search) {
    throw new ValidationError('no search words');
  }

  const tags = await meetingModel.getAskings(search);

  res.json(tags);
});
