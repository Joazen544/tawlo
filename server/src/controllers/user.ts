import { Request, Response } from 'express';
import User from '../models/user';
import signJWT, { EXPIRE_TIME } from '../utils/signJWT';

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

    const token = await signJWT('123');
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

export async function signIn() {
  return 0;
}
