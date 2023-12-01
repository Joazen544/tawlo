import { NextFunction, Request, Response } from 'express';
import { createMeetingToDB } from '../models/meeting';
import User from '../models/user';

export async function createMeeting(
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
    }

    const result = await createMeetingToDB(
      user,
      role,
      userIntro,
      toShare,
      toAsk,
    );

    await User.updateOne({ _id: user }, { meeting: result._id });

    console.log(result);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function abc() {
  return 0;
}
