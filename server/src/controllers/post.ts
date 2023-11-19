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
        'liked.number': 0,
        sum_likes: 0,
        sum_upvotes: 0,
        sum_comments: 0,
        'comments.number': 0,
        publish_date: publishDate,
        update_date: publishDate,
        tags,
        floor: 1,
        hot: 0,
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
        'liked.number': 0,
        sum_likes: 0,
        sum_upvotes: 0,
        sum_comments: 0,
        'comments.number': 0,
        publish_date: publishDate,
        update_date: publishDate,
        tags,
        board,
        floor: 1,
        hot: 0,
      });
    } else if (category === 'reply') {
      postData = await Post.create({
        category,
        author: userId,
        content,
        'liked.number': 0,
        sum_likes: 0,
        sum_upvotes: 0,
        sum_comments: 0,
        'comments.number': 0,
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
    const { content, user, postCategory, motherPost } = req.body;
    const userId = new ObjectId(user);

    const publishDate = new Date();

    console.log(content);
    console.log(postId);

    let result;
    if (postCategory !== 'reply') {
      if (!motherPost) throw Error('reply comment must have mother post id');

      result = await Post.updateOne({ _id: postId }, [
        {
          $set: {
            'comments.data': {
              $concatArrays: [
                '$comments.data',
                [
                  {
                    user: userId,
                    content,
                    time: publishDate,
                  },
                ],
              ],
            },
          },
        },
        {
          $set: {
            'comments.number': { $add: ['$comments.number', 1] },
          },
        },
        {
          $set: {
            sum_comments: { $add: ['$sum_comments', 1] },
          },
        },
        {
          $set: {
            hot: {
              $divide: [
                {
                  $add: ['$sum_likes', '$sum_upvotes', '$sum_comments', 1],
                },
                {
                  $add: [
                    1,
                    {
                      $dateDiff: {
                        startDate: '$publish_date',
                        endDate: '$$NOW',
                        unit: 'day',
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      ]);

      if (result.modifiedCount === 0) {
        throw new Error('Create comment fail');
      }
    } else {
      result = await Post.updateOne({ _id: postId }, [
        {
          $set: {
            'comments.data': {
              $concatArrays: [
                '$comments.data',
                [
                  {
                    user: userId,
                    content,
                    time: publishDate,
                  },
                ],
              ],
            },
          },
        },
        {
          $set: {
            'comments.number': { $add: ['$comments.number', 1] },
          },
        },
      ]);

      if (result.modifiedCount === 0) {
        throw new Error('Create comment fail');
      }

      await Post.updateOne({ _id: motherPost }, [
        {
          $set: {
            sum_comments: { $add: ['$sum_comments', 1] },
          },
        },
        {
          $set: {
            hot: {
              $divide: [
                {
                  $add: ['$sum_likes', '$sum_upvotes', '$sum_comments', 1],
                },
                {
                  $add: [
                    1,
                    {
                      $dateDiff: {
                        startDate: '$publish_date',
                        endDate: '$$NOW',
                        unit: 'day',
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      ]);
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
