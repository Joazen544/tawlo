import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Meeting, {
  createMeeting,
  joinMeeting,
  MeetingDocument,
} from '../models/meeting';
import User, { UserDocument, addNotificationToUserDB } from '../models/user';

export async function accessMeeting(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user, role, userIntro, toShare, toAsk } = req.body;
    if (!role || !userIntro || !toShare || !toAsk) {
      res
        .status(400)
        .json({ error: 'role, user info, to share ,to ask must not be null' });
      return;
    }
    // console.log(user);

    // console.log('weeee');
    // const userId = new ObjectId(user);

    const metUsersResult = await User.findOne(
      { _id: user },
      { met_users: 1, rating: 1, meeting_status: 1 },
    );
    // console.log('22222');

    if (metUsersResult && metUsersResult.meeting_status === 'end') {
      res
        .status(500)
        .json({ error: 'user should give last meeting a score first' });
      return;
    }

    if (metUsersResult && metUsersResult.meeting_status !== 'none') {
      res.status(500).json({ error: 'user already has a meeting' });
      return;
    }

    console.log(metUsersResult);
    const metUsers = metUsersResult?.met_users || [];
    let rating;
    if (metUsersResult) {
      rating = metUsersResult.rating;
    }
    if (!rating) {
      res.status(400).json({ error: 'user does not have rating property' });
      return;
    }

    const joinResult = await joinMeeting(
      metUsers,
      user,
      role,
      rating,
      userIntro,
      toShare,
      toAsk,
    );

    if (joinResult) {
      // joined a meeting
      // send notification to both users

      // can be better!!!

      try {
        await User.updateOne(
          { _id: joinResult.users[0] },
          {
            meeting: joinResult._id,
            meeting_status: 'checking',
            $push: { met_users: user },
          },
        );

        addNotificationToUserDB(joinResult.users[0], 'meet_match', null, null);

        await User.updateOne(
          { _id: user },
          {
            meeting: joinResult._id,
            meeting_status: 'checking',
            $push: { met_users: joinResult.users[0] },
          },
        );

        // addNotificationToUserDB(userId, 'meet_match', null, null);
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
    // else, if false: create a new one

    const createResult = await createMeeting(
      user,
      role,
      rating,
      userIntro,
      toShare,
      toAsk,
    );

    await User.updateOne(
      { _id: user },
      { meeting: createResult._id, meeting_status: 'pending' },
    );

    res.json({
      status: 'No meeting to join, created meeting',
      meetingId: createResult._id,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMeeting(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user } = req.body;

    const userId = new ObjectId(user);

    const result = await User.aggregate([
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

    console.log(result[0].meeting_status);

    if (result[0] && result[0].meeting_status === 'none') {
      res.json({ status: 'none', message: 'no meeting now' });
      return;
    }

    let targetIndex: number = -1;
    let userIndex: number = -1;
    console.log(result[0]);

    if (!result[0].meeting[0]) {
      res.status(400).json({ error: 'the meeting does not exist' });
      return;
    }

    result[0].meeting[0].users.forEach((userInfo: ObjectId, index: number) => {
      if (userInfo.toString() === user) {
        console.log('weee');

        userIndex = index;
      } else {
        console.log('aaaa');

        targetIndex = index;
      }
    });

    if (result[0].meeting_status === 'pending') {
      res.json({
        _id: result[0]._id,
        status: result[0].meeting_status,
        meeting: {
          _id: result[0].meeting[0]._id,
          status: result[0].meeting[0].status,
          user: {
            userId: result[0].meeting[0].users[0],
            role: result[0].meeting[0].role[0],
            user_intro: result[0].meeting[0].user_intro[0],
            rating: Math.round(result[0].meeting[0].ratings[0] * 10) / 10,
            to_share: result[0].meeting[0].to_share[0],
            to_ask: result[0].meeting[0].to_ask[0],
          },
        },
      });
      return;
    }

    console.log(JSON.stringify(result[0], null, 4));

    if (userIndex >= 0 && targetIndex >= 0) {
      res.json({
        _id: result[0]._id,
        status: result[0].meeting_status,
        meeting: {
          _id: result[0].meeting[0]._id,
          status: result[0].meeting[0].status,
          user: {
            userId: result[0].meeting[0].users[userIndex],
            role: result[0].meeting[0].role[userIndex],
            user_intro: result[0].meeting[0].user_intro[userIndex],
            rating:
              Math.round(result[0].meeting[0].ratings[userIndex] * 10) / 10,
            to_share: result[0].meeting[0].to_share[userIndex],
            to_ask: result[0].meeting[0].to_ask[userIndex],
          },
          target: {
            userId: result[0].meeting[0].users[targetIndex],
            role: result[0].meeting[0].role[targetIndex],
            user_intro: result[0].meeting[0].user_intro[targetIndex],
            rating:
              Math.round(result[0].meeting[0].ratings[targetIndex] * 10) / 10,
            to_share: result[0].meeting[0].to_share[targetIndex],
            to_ask: result[0].meeting[0].to_ask[targetIndex],
          },
        },
      });
      return;
    }

    res.status(500).json({ error: 'something is wrong getting meeting info' });
  } catch (err) {
    next(err);
  }
}

export async function replyMeeting(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user, reply } = req.body;
    const { meetingId } = req.params;

    // reply: accept, deny

    if (!reply || !meetingId) {
      res
        .status(400)
        .json({ error: 'reply and meetingId can not be undefined' });
      return;
    }

    if (reply !== 'accept' && reply !== 'deny') {
      res.status(400).json({ error: 'reply must be accept or deny' });
    }
    const meeting = await Meeting.findOne<MeetingDocument>({ _id: meetingId });

    if (!meeting) {
      res.status(400).json({ error: 'meeting does not exist' });
      return;
    }

    if (!meeting.users.includes(user)) {
      res.status(400).json({ error: 'meeting does not include this user' });
      return;
    }

    if (meeting.status !== 'checking') {
      res.status(400).json({ error: 'the meeting is not checking' });
      return;
    }

    console.log(meeting);

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

      // notificate them

      addNotificationToUserDB(meeting.users[0], 'meet_success', null, null);
      addNotificationToUserDB(meeting.users[1], 'meet_success', null, null);

      // open a chat for them
      req.query.target = meeting.accept[0].toString();
      next();
      return;
    }

    // make the meeting fail and find new meetings for both users

    await Meeting.updateOne({ _id: meetingId }, { $set: { status: 'fail' } });

    meeting.users.forEach(async (userId: ObjectId, index: number) => {
      const metUsersResult = await User.findOne(
        { _id: userId },
        { met_users: 1, rating: 1, meeting_status: 1 },
      );

      const metUsers = metUsersResult?.met_users || [];

      const joinResult = await joinMeeting(
        metUsers,
        userId.toString(),
        meeting.role[index],
        meeting.ratings[index],
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

          addNotificationToUserDB(
            joinResult.users[0],
            'meet_match',
            null,
            null,
          );
          addNotificationToUserDB(userId, 'meet_match', null, null);
        } catch (err) {
          throw new Error(
            `something wrong updating meeting info for users: ${err}`,
          );
        }
      } else {
        // else, if false: create a new one

        const createResult = await createMeeting(
          userId.toString(),
          meeting.role[index],
          meeting.ratings[index],
          meeting.user_intro[index],
          meeting.to_share[index],
          meeting.to_ask[index],
        );

        addNotificationToUserDB(userId, 'meet_match', null, null);

        await User.updateOne(
          { _id: userId },
          { meeting: createResult._id, meeting_status: 'pending' },
        );

        // notificate the user the result
      }
    });
    res.json({ message: 'create or join new meeting for users' });
  } catch (err) {
    next(err);
  }
}

export async function scoreMeeting(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user, score, targetUser, comment } = req.body;
    const { meetingId } = req.params;
    console.log(user);
    if (!comment) {
      res.status(400).json({ error: 'comment is missing' });
      return;
    }
    if (!score) {
      res.status(400).json({ error: 'score is missing' });
      return;
    }

    if (typeof score !== 'number') {
      res.status(400).json({ error: 'score is not number' });
      return;
    }
    console.log(meetingId);

    const meeting = await Meeting.findOne({ _id: meetingId });

    if (!meeting) {
      res.status(400).json({ error: 'meeting does not exist' });
      return;
    }

    if (!meeting.users.includes(user)) {
      res.status(400).json({ error: 'meeting does not include this user' });
      return;
    }

    if (!meeting.users.includes(targetUser)) {
      res.status(400).json({ error: 'meeting does not include target user' });
      return;
    }

    console.log(score);

    const userInfo = await User.findOne<UserDocument>({ _id: targetUser });
    if (!userInfo) {
      res.status(400).json({ error: 'user does not exist' });
      return;
    }
    const { rating } = userInfo;
    const ratingNumber = userInfo.rating_number;
    const newRatingNumber = ratingNumber + 1;
    const newRating = (rating * ratingNumber + score) / newRatingNumber;
    console.log(newRating);

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
  } catch (err) {
    next(err);
  }
}

export async function cancelMeeting(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user } = req.body;
    const userMeetingInfo = await User.findOne(
      { _id: user },
      { meeting_status: 1, meeting: 1 },
    );

    if (!userMeetingInfo) {
      res.status(400).json({ error: 'user does not exist' });
      return;
    }

    if (userMeetingInfo.meeting_status !== 'pending') {
      res.status(400).json({ error: 'user can only cancel pending meeting' });
      return;
    }

    await Meeting.updateOne(
      { _id: userMeetingInfo.meeting },
      { status: 'fail' },
    );

    await User.updateOne({ _id: user }, { $set: { meeting_status: 'none' } });

    res.json({ message: 'cancel meeting success' });
  } catch (err) {
    next(err);
  }
}
