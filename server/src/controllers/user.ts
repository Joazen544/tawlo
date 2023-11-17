import { Request, Response } from 'express';
import User, { UserDocument } from '../models/user';
import { EXPIRE_TIME, signJWT } from '../utils/JWT';

export async function signUp(req: Request, res: Response) {
  try {
    console.log('signing up');

    const { name, email, password, passwordConfirm } = req.body;
    const userData = await User.create({
      name,
      email,
      password,
      password_confirm: passwordConfirm,
    });
    console.log(userData);

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
    console.log(userData);
    if (
      !userData ||
      !(await userData.correctPassword(password, userData.password))
    ) {
      res.status(401).json({ error: 'Incorrect email or password' });
      return;
    }

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
            name: userData.name,
            email,
            picture: '',
          },
        },
      });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ errors: err.message });
      return;
    }
    res.status(500).json({ errors: 'sign in failed' });
  }
}
