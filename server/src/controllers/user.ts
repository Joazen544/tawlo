import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import User, {
  UserDocument,
  updateUserReadPosts,
  getUserRelationFromDB,
  createRelation,
} from '../models/user';
import { EXPIRE_TIME, signJWT } from '../utils/JWT';

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
        access_token: token,
        access_expired: EXPIRE_TIME,
        user: {
          id: userData._id,
          name,
          email,
          picture: '',
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
        access_token: token,
        access_expired: EXPIRE_TIME,
        user: {
          id: userData._id,
          name: userData.name,
          email,
          picture: '',
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

export async function updateUserRead(req: Request, res: Response) {
  try {
    const { user, posts } = req.body;

    const postsId = posts.map((post: string) => new ObjectId(post));

    const userId = new ObjectId(user);

    updateUserReadPosts(userId, postsId);

    res.json({ message: 'Update success' });
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      res.status(400).json({ errors: err.message });
      return;
    }
    res.status(500).json({ errors: 'sign in failed' });
  }
}

export async function getUserName(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    let user;
    if (req.query.id && typeof req.query.id === 'string') user = req.query.id;

    // console.log(user);

    const userInfo = await User.findOne({ _id: user }, { name: 1 });

    if (userInfo && userInfo.name) {
      res.json({ name: userInfo.name });
    } else {
      throw Error('can not find user name');
    }
  } catch (err) {
    next(err);
  }
}

export async function getUserRelation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user } = req.body;
    const id = req.query.id as string;

    if (!id) {
      res.status(500).json({ error: 'target id is missing' });
      return;
    }

    const relation = await getUserRelationFromDB(user, id);

    res.json({ relation });
  } catch (err) {
    next(err);
  }
}

export async function sendRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user } = req.body;
    const id = req.query.id as string;

    if (!id) {
      res.status(500).json({ error: 'target id is missing' });
      return;
    }

    const result = await createRelation(user, id);
    if (result) {
      res.json({ status: 'success' });
      return;
    }
    res.status(500).json({ error: 'create friend relation fail' });
  } catch (err) {
    next(err);
  }
}
