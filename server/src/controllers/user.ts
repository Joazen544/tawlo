import { Request, Response } from 'express';
import * as userModel from '../models/user';
import signJWT, { EXPIRE_TIME } from '../utils/signJWT';

export async function signUp(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;
    const userId = await userModel.createUser(name, email, password);
    const token = await signJWT(userId);
    res
      .cookie('jwtToken', token)
      .status(200)
      .json({
        data: {
          access_token: token,
          access_expired: EXPIRE_TIME,
          user: {
            id: userId,
            name,
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
    res.status(500).json({ errors: 'sign up failed' });
  }
}

export async function signIn() {}
