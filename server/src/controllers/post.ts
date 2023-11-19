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
      replyFloor,
    } = req.body;

    const userId = new ObjectId(user);
    const publishDate = new Date();

    let postData;
    if (category === 'native') {
      postData = await Post.create({
        category,
        author: userId,
        content,
        publish_date: publishDate,
        update_date: publishDate,
        tags,
        floor: 1,
      });
    } else if (category === 'mother') {
      if (title === undefined) {
        throw new Error('A mother post should contain title');
      }
      postData = await Post.create({
        category,
        author: userId,
        title,
        content,
        publish_date: publishDate,
        update_date: publishDate,
        tags,
        board,
        floor: 1,
      });
    } else if (category === 'reply') {
      postData = await Post.create({
        category,
        author: userId,
        content,
        publish_date: publishDate,
        update_date: publishDate,
        tags,
        board,
        mother_post: motherPost,
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

export async function commentPost(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    const { content, user } = req.body;
    const userId = new ObjectId(user);

    const publishDate = new Date();

    console.log(content);
    console.log(postId);

    const result = await Post.updateOne(
      { _id: postId },
      {
        $push: {
          'comments.data': {
            user: userId,
            content,
            time: publishDate,
          },
        },
        $inc: {
          'comments.number': 1,
        },
      },
    );

    if (result.acknowledged === false) {
      throw new Error('Create comment fail');
    }

    return res.json({ message: 'Add comment success' });
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Create comment fail' });
  }
}
