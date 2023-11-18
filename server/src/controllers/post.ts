import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Post from '../models/post';

export async function createPost(req: Request, res: Response) {
  try {
    const {
      category,
      user,
      title,
      content,
      tags,
      board,
      motherPost,
      floor,
      replyFloor,
    } = req.body;

    const userId = new ObjectId(user);
    const publishDate = new Date();

    let postData;
    if (category === 'native') {
      postData = await Post.create({
        category,
        author: userId,
        title,
        content,
        publish_date: publishDate,
        tags,
        floor: 1,
      });
    } else if (category === 'mother') {
      postData = await Post.create({
        category,
        author: userId,
        title,
        content,
        publish_date: publishDate,
        tags,
        board,
        floor: 1,
      });
    } else if (category === 'reply') {
      postData = await Post.create({
        category,
        author: userId,
        title,
        content,
        publish_date: publishDate,
        tags,
        board,
        mother_post: motherPost,
        floor,
        reply_floor: replyFloor,
      });
    } else {
      res.status(400).json({ error: 'The category of post is wrong' });
    }

    res.json({
      data: postData,
    });
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      res.status(400).json({ errors: err.message });
      return;
    }
    res.status(500).json({ errors: 'sign up failed' });
  }
}

export function abc() {}
