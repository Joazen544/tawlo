import { NextFunction, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import User, {
  UserDocument,
  updateUserReadPosts,
  getUserRelationFromDB,
  createRelation,
  cancelRequestFromDB,
  getNotificationsFromDB,
  readNotificationsFromDB,
  addNotificationToUserDB,
  getUserInfoFromDB,
  refuseRequestFromDB,
  getUserFriendsFromDB,
} from '../models/user';
import { EXPIRE_TIME, signJWT } from '../utils/JWT';
import { sendNotificationThroughSocket } from './socket';
import 'dotenv';
import redisClient from '../utils/redis';

const CDN_DOMAIN = process.env.DISTRIBUTION_DOMAIN;
const USER_INFO_EXPIRE_SECONDS = 21600;

export async function signUp(req: Request, res: Response) {
  try {
    const { name, email, password, passwordConfirm } = req.body;
    let image;
    if (req.file) {
      image = req.file.filename;
    }

    const userData = await User.create({
      name,
      email,
      password,
      image,
      password_confirm: passwordConfirm,
    });

    const token = await signJWT(userData._id.toString());

    if (image) {
      fs.unlink(`${__dirname}/../../public/userImage/${image}`, () => {});
    }

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

export async function getUserInfo(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.query;
    if (!id) {
      res.status(400).json({ error: 'user id is not in req body' });
      return;
    }

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'user id is not string' });
      return;
    }

    try {
      const result = await redisClient.hGetAll(`${id}info`);
      if (result.name && result.image !== undefined) {
        // is saved in redis
        let imageUrl;
        if (result.image === '') {
          imageUrl = '';
        } else {
          imageUrl = `${CDN_DOMAIN}/user-image/${result.image}`;
        }
        // console.log('get user info from redis');

        res.json({ image: imageUrl, name: result.name });
        return;
      }
    } catch (err) {
      console.log(err);
      console.log('something is wrong getting user info from redis');
    }

    const userInfo = await getUserInfoFromDB(id);

    if (!userInfo) {
      res.status(400).json({ error: 'user does not exist' });
      return;
    }

    let imageUrl;
    if (userInfo.image === '') {
      imageUrl = '';
    } else {
      imageUrl = `${CDN_DOMAIN}/user-image/${userInfo.image}`;
    }

    try {
      await redisClient.hSet(`${id}info`, 'name', userInfo.name);
      await redisClient.hSet(`${id}info`, 'image', userInfo.image);
      await redisClient.expire(`${id}info`, USER_INFO_EXPIRE_SECONDS);
      console.log('set user name and image to redis');
    } catch (err) {
      console.log(err);
    }

    res.json({ image: imageUrl, name: userInfo.name });
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
    const targetId = req.query.id as string;

    if (!targetId) {
      res.status(500).json({ error: 'target id is missing' });
      return;
    }

    const result = await createRelation(user, targetId);
    const userId = new ObjectId(user);
    const targetUserId = new ObjectId(targetId);

    if (result === 'send') {
      addNotificationToUserDB(targetUserId, 'friend_request', userId, null);
      sendNotificationThroughSocket(
        targetId,
        'friend_request',
        '有人發出交友邀請',
        user,
        undefined,
      );
    } else if (result === 'accept') {
      addNotificationToUserDB(targetUserId, 'request_accepted', userId, null);
      sendNotificationThroughSocket(
        targetId,
        'request_accepted',
        '有人接受你的邀請',
        user,
        undefined,
      );
    }
    if (result) {
      res.json({ status: 'send or accept request success' });
      return;
    }
    res.status(500).json({ error: 'create friend relation fail' });
  } catch (err) {
    next(err);
  }
}

export async function cancelRequest(
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

    const result = await cancelRequestFromDB(user, id);
    if (result) {
      res.json({ status: 'cancel request success' });
      return;
    }
    res.status(500).json({ error: 'cancel request fail' });
  } catch (err) {
    next(err);
  }
}

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user } = req.body;
    const userId = new ObjectId(user);

    const notifications = await getNotificationsFromDB(userId);
    if (notifications === false) {
      res.status(400).json({ error: 'no such user' });
      return;
    }

    notifications.forEach((notification) => {
      switch (notification.category) {
        case 'reply_post':
          notification.message = '回覆了你的貼文';
          break;
        case 'comment_post':
          notification.message = '在你的貼文留言';
          break;
        case 'upvote_post':
          notification.message = '覺得你的貼文有用';
          break;
        case 'like_post':
          notification.message = '喜歡你的貼文';
          break;
        case 'comment_replied':
          notification.message = '回覆了你的留言';
          break;
        case 'like_comment':
          notification.message = '喜歡你的留言';
          break;
        case 'meet_match':
          notification.message = '配對成功，看看對方的資訊';
          break;
        case 'meet_success':
          notification.message = '配對完成，找對方聊聊吧';
          break;
        case 'meet_fail':
          notification.message = '配對失敗，重新找人中！';
          break;
        case 'friend_request':
          notification.message = '有人想加你好友';
          break;
        case 'request_accepted':
          notification.message = '交友邀請被接受囉';
          break;
        default:
          notification.message = '';
      }
    });

    res.json(notifications.reverse());
  } catch (err) {
    next(err);
  }
}

export async function readAllNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user } = req.body;
    const userId = new ObjectId(user);

    const updateResult = await readNotificationsFromDB(userId);
    if (updateResult === false) {
      res.status(400).json({
        error:
          'no such user or something wrong updating read all notifications',
      });
      return;
    }

    res.json({ message: 'read all notifications' });
  } catch (err) {
    next(err);
  }
}

export async function changeImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user } = req.body;
    let imageName;
    if (req.file) {
      imageName = req.file.filename;
    } else {
      res.status(400).json({ error: 'no image in req' });
    }

    await User.updateOne({ _id: user }, { $set: { image: imageName } });

    try {
      await redisClient.del(`${user}info`);
      // console.log('delete user info from redis');
    } catch (err) {
      console.log(err);
    }

    if (imageName) {
      fs.unlink(`${__dirname}/../../public/userImage/${imageName}`, () => {});
    }

    res.json({ image: `${CDN_DOMAIN}/user-image/${imageName}` });
  } catch (err) {
    next(err);
  }
}

export async function getFriendsList(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user } = req.body;

    if (!user) {
      res.status(400).json({ error: 'no user info' });
      return;
    }

    const userFriends = await getUserFriendsFromDB(user);

    res.json(userFriends);
  } catch (err) {
    next(err);
  }
}

export async function getAllFriendsList(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user } = req.body;

    const userInfo = await User.findOne({ _id: user });

    if (!userInfo) {
      res.status(400).json({ error: 'user does not exist' });
      return;
    }

    const requestedFriendArray: ObjectId[] = [];
    const receiveFriendArray: ObjectId[] = [];
    const friendArray: ObjectId[] = [];

    userInfo.friends.forEach((friend) => {
      if (friend.status === 'requested') {
        requestedFriendArray.push(friend.user);
      } else if (friend.status === 'received') {
        receiveFriendArray.push(friend.user);
      } else if (friend.status === 'friends') {
        friendArray.push(friend.user);
      }
    });

    res.json({
      friend: friendArray,
      requested: requestedFriendArray,
      receive: receiveFriendArray,
    });
  } catch (err) {
    next(err);
  }
}

export async function refuseRequest(
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

    const result = await refuseRequestFromDB(user, id);
    if (result) {
      res.json({ status: 'refuse request success' });
      return;
    }
    res.status(500).json({ error: 'refuse request fail' });
  } catch (err) {
    next(err);
  }
}
