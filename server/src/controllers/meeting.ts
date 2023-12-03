import { NextFunction, Request, Response } from 'express';
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
        await User.updateMany(
          { _id: [joinResult.users[0], user] },
          { meeting: joinResult._id, meeting_status: 'checking' },
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

export async function abc() {
  return 0;
}
