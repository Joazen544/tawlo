import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import User, { UserDocument } from '../models/user';
import { EXPIRE_TIME, signJWT } from '../utils/JWT';

export function updateUserAction(
  userId: ObjectId,
  tags: string[],
  board: ObjectId,
) {
  try {
    User.findOne({ _id: userId }).then((doc) => {
      if (doc) {
        const replaceTarget = doc.preference_tags.length - 1;
        tags.forEach((tag) => {
          let ifExist = 0;
          const len = doc.preference_tags.length;

          doc.preference_tags.forEach((preference) => {
            if (preference.name === tag) {
              preference.number = +preference.number + len;
              ifExist += 1;
            }
          });

          if (ifExist) {
            doc.preference_tags.forEach((preference) => {
              preference.number = +preference.number - ifExist;
            });
          } else if (len === 0) {
            doc.preference_tags.push({ name: tag, number: 20 });
          } else if (len < 6) {
            doc.preference_tags.push({ name: tag, number: 0 });
          } else {
            doc.preference_tags[replaceTarget].name = tag;
          }
        });

        doc.read_board.push(board);
        doc.read_board = doc.read_board.slice(1, 5);

        doc.preference_tags.sort((aTag, bTag) => +bTag.number - +aTag.number);
        doc.save();
      }
    });
  } catch (err) {
    console.log(err);
    throw Error('Something goes wrong updating user action');
  }
}

export async function signUp(req: Request, res: Response) {
  try {
    const { name, email, password, passwordConfirm } = req.body;
    const userData = await User.create({
      name,
      email,
      password,
      password_confirm: passwordConfirm,
    });

    const token = await signJWT(JSON.stringify(userData._id));
    res
      .cookie('jwtToken', token)
      .status(200)
      .json({
        data: {
          access_token: token,
          access_expired: EXPIRE_TIME,
          user: {
            id: userData._id,
            name,
            email,
            picture: '',
          },
        },
      });
  } catch (err) {
    console.log(err);
    if (err instanceof Error && err.message.slice(0, 6) === 'E11000') {
      res.status(400).json({ errors: 'This email already exist' });
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ errors: err.message });
      return;
    }
    res.status(500).json({ errors: 'sign up failed' });
  }
}

export async function signIn(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const userData: UserDocument = await User.findOne({ email }).select(
      '+password',
    );

    if (
      !userData ||
      !(await userData.correctPassword(password, userData.password))
    ) {
      res.status(401).json({ error: 'Incorrect email or password' });
      return;
    }

    const token = await signJWT(userData._id.toString());
    res
      .cookie('jwtToken', token)
      .status(200)
      .json({
        data: {
          access_token: token,
          access_expired: EXPIRE_TIME,
          user: {
            id: userData._id,
            name: userData.name,
            email,
            picture: '',
          },
        },
      });
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      res.status(400).json({ errors: err.message });
      return;
    }
    res.status(500).json({ errors: 'sign in failed' });
  }
}
