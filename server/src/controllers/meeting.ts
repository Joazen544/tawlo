import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { createMeeting, joinMeeting } from '../models/meeting';
import User from '../models/user';

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

    const metUsersResult = await User.findOne(
      { _id: user },
      { met_users: 1, rating: 1, meeting_status: 1 },
    );

    if (metUsersResult && metUsersResult.meeting_status !== 'none') {
      res.status(500).json({ error: 'user already has a meeting' });
      return;
    }

    console.log(metUsersResult);
    const metUsers = metUsersResult?.met_users || [];
    const rating = metUsersResult?.rating || 3;

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

      try {
        await User.updateOne(
          { _id: joinResult.users[0] },
          {
            meeting: joinResult._id,
            meeting_status: 'checking',
            $push: { met_users: user },
          },
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

    if (result[0] && result[0].meeting_status === 'end') {
      res.json({ status: 'end', message: 'no meeting now' });
      return;
    }

    let targetIndex: number = -1;
    let userIndex: number = -1;

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
        meeting_status: result[0].meeting_status,
        meeting: {
          _id: result[0].meeting[0]._id,
          status: result[0].meeting[0].status,
          user: {
            userId: result[0].meeting[0].users[0],
            role: result[0].meeting[0].role[0],
            user_intro: result[0].meeting[0].user_intro[0],
            to_share: result[0].meeting[0].to_share[0],
            to_ask: result[0].meeting[0].to_ask[0],
          },
        },
      });
      return;
    }

    if (userIndex >= 0 && targetIndex >= 0) {
      res.json({
        _id: result[0]._id,
        meeting_status: result[0].meeting_status,
        meeting: {
          _id: result[0]._id,
          meeting_status: result[0].meeting_status,
          meeting: {
            _id: result[0].meeting._id,
            status: result[0].meeting.status,
            user: {
              userId: result[0].meeting[0].users[userIndex],
              role: result[0].meeting[0].role[userIndex],
              user_intro: result[0].meeting[0].user_intro[userIndex],
              to_share: result[0].meeting[0].to_share[userIndex],
              to_ask: result[0].meeting[0].to_ask[userIndex],
            },
            target: {
              userId: result[0].meeting[0].users[targetIndex],
              role: result[0].meeting[0].role[targetIndex],
              user_intro: result[0].meeting[0].user_intro[targetIndex],
              to_share: result[0].meeting[0].to_share[targetIndex],
              to_ask: result[0].meeting[0].to_ask[targetIndex],
            },
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
