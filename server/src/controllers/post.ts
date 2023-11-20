import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Post from '../models/post';

async function calculateMotherPostHot(
  postId: string,
  increaseField: string,
  increase: boolean,
) {
  let field = '';
  if (increaseField === 'comment') {
    field = 'sum_comments';
  } else if (increaseField === 'like') {
    field = 'sum_likes';
  } else if (increaseField === 'upvote') {
    field = 'sum_upvotes';
  } else {
    throw Error('the increase field sent to calculate hot function is wrong');
  }

  let num;
  if (increase === true) {
    num = 1;
  } else {
    num = -1;
  }

  const calculateResult = await Post.updateOne({ _id: postId }, [
    {
      $set: {
        [field]: { $add: [`$${field}`, num] },
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

  console.log(calculateResult);
  if (calculateResult.modifiedCount === 0) {
    throw Error('calculate hot fail');
  }

  return true;
}

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
    const { content, user, postCategory, motherPost } = req.body;
    const userId = new ObjectId(user);

    // need to check post category in future
    const publishDate = new Date();

    console.log(content);
    console.log(postId);

    let result;
    if (postCategory === 'mother' || postCategory === 'native') {
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
                    like: {
                      number: 0,
                      users: [],
                    },
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

      if (result.acknowledged === false) {
        throw new Error('Create comment fail');
      }
    } else {
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
      ]);

      if (result.acknowledged === false) {
        throw new Error('Create comment fail');
      }

      // ??? the type of motherPost should be fixed
      const calculateResult = await calculateMotherPostHot(
        motherPost,
        'comment',
        true,
      );

      if (calculateResult !== true) {
        throw Error('calculate hot fail');
      }
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

export async function likeComment(req: Request, res: Response) {
  try {
    let floor;
    if (req.query.floor) floor = parseInt(req.query.floor as string, 10);
    if (typeof floor !== 'number') {
      throw Error('query floor should be a number');
    }

    const { postId } = req.params;
    const { user, like } = req.body;
    const userId = new ObjectId(user);

    const commentTargetLike = `comments.data.${floor}.like.number`;
    const commentTargetUser = `comments.data.${floor}.like.users`;

    // check if the post and comment exist
    const likeTargetComment = await Post.findOne(
      {
        _id: postId,
        // [commentTargetUser]: { $in: [userId] },
      },
      { _id: 1, comments: 1 },
    );

    if (likeTargetComment === null || !likeTargetComment.comments.data[floor]) {
      throw Error('like target post or comment floor does not exist');
    }

    // check if user already like the comment
    const ifAlreadyLike =
      likeTargetComment.comments.data[floor].like.users.includes(userId);
    console.log('userId: ');
    console.log(userId);

    // ??? how to check if comment exist

    let result;
    if (like === true) {
      if (ifAlreadyLike === true) {
        throw Error('user already liked the comment');
      }
      console.log('liking comment');

      result = await Post.updateOne(
        { _id: postId },
        {
          $inc: { [commentTargetLike]: 1 },
          $push: { 'comments.data.0.like.users': userId },
        },
      );

      if (result.acknowledged === false) {
        throw Error('like comment fail');
      }
      res.json({ message: 'like comment success' });
      return;
    }

    if (like === false) {
      if (ifAlreadyLike === false) {
        throw Error('user did not like the comment');
      }
      result = await Post.updateOne(
        { _id: postId },
        {
          $inc: { [commentTargetLike]: -1 },
          $pull: { [commentTargetUser]: userId },
        },
      );

      if (result.acknowledged === false) {
        throw Error('like comment fail');
      }
      res.json({ message: 'dislike comment success' });
      return;
    }

    res
      .status(500)
      .json({ error: 'something is wrong creating like to comment' });
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Create comment fail' });
  }
}

export async function likePost(req: Request, res: Response) {
  // check if post exist
  // check post category ??? which should be implement to some other api
  // deal with like
  // calculate hot
  try {
    const { postId } = req.params;
    const { user, like } = req.body;
    const userId = new ObjectId(user);

    // check if the post and comment exist
    const likeTarget = await Post.findOne(
      {
        _id: postId,
      },
      { _id: 1, liked: 1, category: 1, mother_post: 1 },
    );

    console.log(JSON.stringify(likeTarget, null, 4));

    if (likeTarget === null) {
      throw Error('like target post does not exist');
    }

    // check if user already like the comment
    const ifAlreadyLike = likeTarget.liked.users.includes(userId);

    console.log('userId: ');
    console.log(userId);

    // ??? how to check if comment exist

    let increment;
    let pushOrPull;
    let udjustUserArray;
    let message;
    if (like === true) {
      increment = 1;
      pushOrPull = '$push';
      udjustUserArray = {
        'liked.users': {
          $concatArrays: ['$liked.users', [userId]],
        },
      };
      message = 'like';

      if (ifAlreadyLike === true) {
        throw Error('user already liked the post');
      }
    } else if (like === false) {
      increment = -1;
      pushOrPull = '$pull';
      udjustUserArray = {
        'liked.users': {
          $filter: {
            input: '$liked.users',
            as: 'user',
            cond: { $ne: ['$$user', userId] },
          },
        },
      };
      message = 'dislike';

      if (ifAlreadyLike === false) {
        throw Error('user did not like the post');
      }
    } else {
      throw Error('req body must contain like, and it should be boolean');
    }

    console.log(udjustUserArray);

    let result;
    console.log('liking comment');

    if (likeTarget.category === 'mother' || likeTarget.category === 'native') {
      // update like and calculate hot
      result = await Post.updateOne({ _id: postId }, [
        {
          $set: { 'liked.number': { $add: ['$liked.number', increment] } },
        },
        {
          $set: udjustUserArray,
        },
        {
          $set: {
            sum_likes: { $add: ['$sum_likes', increment] },
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

      if (result.acknowledged === false) {
        throw Error('like a post fail');
      }

      res.json({ message: `${message} post success` });
      return;
    }

    if (likeTarget.category === 'reply') {
      result = await Post.updateOne(
        { _id: postId },
        {
          $inc: { 'liked.number': 1 },
          [pushOrPull]: { 'liked.users': userId },
        },
      );

      if (result.acknowledged === false) {
        throw Error('like a post fail');
      }

      const motherPost = likeTarget.mother_post.toString();

      const calculateResult = await calculateMotherPostHot(
        motherPost,
        'like',
        like,
      );

      if (calculateResult !== true) {
        throw Error('calculate hot fail');
      }

      res.json({ message: `${message} post success` });
      return;
    }

    res.status(500).json({ error: 'something is wrong liking a post' });
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Create comment fail' });
  }
}
