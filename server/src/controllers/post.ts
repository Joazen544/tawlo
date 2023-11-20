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
    console.log('field is: ');
    console.log(field);
  } else {
    throw Error('the increase field sent to calculate hot function is wrong');
  }

  let num;
  if (increase === true) {
    num = 1;
  } else {
    num = -1;
  }
  console.log('num is: ');
  console.log(num);

  console.log('post id is: ');

  console.log(postId);

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
  if (calculateResult.modifiedCount !== 1) {
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

    // check if the post exist
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

    // check if user already like the post
    const ifAlreadyLike = likeTarget.liked.users.includes(userId);

    console.log('userId: ');
    console.log(userId);

    let increment;
    let pushOrPull;
    let adjustUserArray;
    let message;
    if (like === true) {
      increment = 1;
      pushOrPull = '$push';
      adjustUserArray = {
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
      adjustUserArray = {
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

    console.log(adjustUserArray);

    let result;
    console.log('liking comment');

    if (likeTarget.category === 'mother' || likeTarget.category === 'native') {
      // update like and calculate hot
      result = await Post.updateOne({ _id: postId }, [
        {
          $set: { 'liked.number': { $add: ['$liked.number', increment] } },
        },
        {
          $set: adjustUserArray,
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
          $inc: { 'liked.number': increment },
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

export async function upvotePost(req: Request, res: Response) {
  // check if post exist
  // check post category
  // deal with upvote
  // calculate hot
  try {
    const { postId } = req.params;
    const { user, upvote } = req.body;
    const userId = new ObjectId(user);

    // check if the post exist
    const upvoteTarget = await Post.findOne(
      {
        _id: postId,
      },
      { _id: 1, upvote: 1, category: 1, mother_post: 1, downvote: 1 },
    );

    console.log(JSON.stringify(upvoteTarget, null, 4));

    if (upvoteTarget === null) {
      throw Error('upvote target post does not exist');
    }

    // check if user already upvote the post
    const ifAlreadyUpvote = upvoteTarget.upvote.users.includes(userId);
    const ifAlreadyDownVote = upvoteTarget.downvote.users.includes(userId);

    console.log('userId: ');
    console.log(userId);

    // ??? how to check if comment exist

    let increment;
    let pushOrPull;
    let adjustUserArray;
    let message;
    if (upvote === true) {
      increment = 1;
      pushOrPull = '$push';
      adjustUserArray = {
        'upvote.users': {
          $concatArrays: ['$upvote.users', [userId]],
        },
      };
      message = 'upvote';

      if (ifAlreadyUpvote === true) {
        throw Error('user already upvoted the post');
      }
    } else if (upvote === false) {
      increment = -1;
      pushOrPull = '$pull';
      adjustUserArray = {
        'upvote.users': {
          $filter: {
            input: '$upvote.users',
            as: 'user',
            cond: { $ne: ['$$user', userId] },
          },
        },
      };
      message = 'disupvote';

      if (ifAlreadyUpvote === false) {
        throw Error('user did not upvote the post');
      }
    } else {
      throw Error('req body must contain key upvote, and it should be boolean');
    }

    let result;
    console.log('upvoting post');

    if (
      upvoteTarget.category === 'mother' ||
      upvoteTarget.category === 'native'
    ) {
      // update upvote and calculate hot
      result = await Post.updateOne({ _id: postId }, [
        {
          $set: { 'upvote.number': { $add: ['$upvote.number', increment] } },
        },
        {
          $set: adjustUserArray,
        },
        {
          $set: {
            sum_upvotes: { $add: ['$sum_upvotes', increment] },
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
        throw Error(`${message} a post fail`);
      }

      let cancelDownVoteResult;
      if (ifAlreadyDownVote && upvote) {
        // cancel the down vote
        cancelDownVoteResult = await Post.updateOne({ _id: postId }, [
          {
            $set: {
              'downvote.number': { $add: ['$downvote.number', -1] },
            },
          },
          {
            $set: {
              'downvote.users': {
                $filter: {
                  input: '$downvote.users',
                  as: 'user',
                  cond: {
                    $ne: ['$$user', userId],
                  },
                },
              },
            },
          },
          {
            $set: {
              sum_upvotes: { $add: ['$sum_upvotes', 1] },
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

        if (cancelDownVoteResult.acknowledged === false) {
          throw new Error('cancel downvote fail');
        }
      }

      res.json({ message: `${message} post success` });
      return;
    }

    if (upvoteTarget.category === 'reply') {
      result = await Post.updateOne(
        { _id: postId },
        {
          $inc: { 'upvote.number': increment },
          [pushOrPull]: { 'upvote.users': userId },
        },
      );

      if (result.acknowledged === false) {
        throw Error('upvote a post fail');
      }

      const motherPost = upvoteTarget.mother_post.toString();

      const calculateResult = await calculateMotherPostHot(
        motherPost,
        'upvote',
        upvote,
      );

      if (calculateResult !== true) {
        throw Error('calculate hot fail');
      }

      // ////////////////////
      if (ifAlreadyDownVote && upvote) {
        // cancel the down vote
        // and cancel it from mother post
        const cancelDownVoteResult = await Post.updateOne({ _id: postId }, [
          {
            $set: {
              'downvote.number': { $add: ['$downvote.number', -1] },
            },
          },
          {
            $set: {
              'downvote.users': {
                $filter: {
                  input: '$downvote.users',
                  as: 'user',
                  cond: {
                    $ne: ['$$user', userId],
                  },
                },
              },
            },
          },
        ]);

        if (cancelDownVoteResult.acknowledged === false) {
          throw new Error('cancel downvote fail');
        }

        const cancelDownVoteFromMotherResult = await Post.updateOne(
          { _id: motherPost },
          [
            {
              $set: {
                sum_upvotes: { $add: ['$sum_upvotes', 1] },
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
          ],
        );

        if (cancelDownVoteFromMotherResult.acknowledged === false) {
          throw new Error('cancel downvote from mother fail');
        }
      }

      res.json({ message: `${message} post success` });
      return;
    }

    res.status(500).json({ error: 'something is wrong upvoting a post' });
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Upvote a post fail' });
  }
}

export async function downvotePost(req: Request, res: Response) {
  // check if post exist
  // check post category
  // deal with downvote
  // calculate hot
  try {
    const { postId } = req.params;
    const { user, downvote } = req.body;
    const userId = new ObjectId(user);

    // check if the post exist
    const downvoteTarget = await Post.findOne(
      {
        _id: postId,
      },
      { _id: 1, upvote: 1, category: 1, mother_post: 1, downvote: 1 },
    );

    console.log(JSON.stringify(downvoteTarget, null, 4));

    if (downvoteTarget === null) {
      throw Error('downvote target post does not exist');
    }

    // check if user already upvote the post
    const ifAlreadyUpvote = downvoteTarget.upvote.users.includes(userId);
    const ifAlreadyDownVote = downvoteTarget.downvote.users.includes(userId);

    console.log('userId: ');
    console.log(userId);

    let increment;
    let pushOrPull;
    let adjustUserArray;
    let message;

    if (downvote === true) {
      increment = 1;
      pushOrPull = '$push';
      adjustUserArray = {
        'downvote.users': {
          $concatArrays: ['$downvote.users', [userId]],
        },
      };
      message = 'downvote';

      if (ifAlreadyDownVote === true) {
        throw Error('user already downvoted the post');
      }
    } else if (downvote === false) {
      increment = -1;
      pushOrPull = '$pull';
      adjustUserArray = {
        'downvote.users': {
          $filter: {
            input: '$downvote.users',
            as: 'user',
            cond: { $ne: ['$$user', userId] },
          },
        },
      };
      message = 'disdownvote';

      if (ifAlreadyDownVote === false) {
        throw Error('user did not upvote the post');
      }
    } else {
      throw Error(
        'req body must contain key downvote, and it should be boolean',
      );
    }

    let result;
    console.log('downvoting post');

    if (
      downvoteTarget.category === 'mother' ||
      downvoteTarget.category === 'native'
    ) {
      // update upvote and calculate hot
      result = await Post.updateOne({ _id: postId }, [
        {
          $set: {
            'downvote.number': { $add: ['$downvote.number', increment] },
          },
        },
        {
          $set: adjustUserArray,
        },
        {
          $set: {
            sum_downvotes: { $add: ['$sum_downvotes', increment] },
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
        throw Error(`${message} a post fail`);
      }

      let cancelUpvoteResult;
      if (ifAlreadyUpvote && downvote) {
        // cancel the down vote
        cancelUpvoteResult = await Post.updateOne({ _id: postId }, [
          {
            $set: {
              'upvote.number': { $add: ['$upvote.number', -1] },
            },
          },
          {
            $set: {
              'upvote.users': {
                $filter: {
                  input: '$upvote.users',
                  as: 'user',
                  cond: {
                    $ne: ['$$user', userId],
                  },
                },
              },
            },
          },
          {
            $set: {
              sum_upvotes: { $add: ['$sum_upvotes', -1] },
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

        if (cancelUpvoteResult.acknowledged === false) {
          throw new Error('cancel upvote fail');
        }
      }

      res.json({ message: `${message} post success` });
      return;
    }

    if (downvoteTarget.category === 'reply') {
      result = await Post.updateOne(
        { _id: postId },
        {
          $inc: { 'downvote.number': increment },
          [pushOrPull]: { 'downvote.users': userId },
        },
      );

      if (result.acknowledged === false) {
        throw Error('downvote a post fail');
      }

      const motherPost = downvoteTarget.mother_post.toString();

      const calculateResult = await calculateMotherPostHot(
        motherPost,
        'upvote',
        !downvote,
      );

      if (calculateResult !== true) {
        throw Error('calculate hot fail');
      }

      let cancelUpvoteResult;
      // ////////////////////
      if (ifAlreadyUpvote && downvote) {
        // cancel the down vote
        cancelUpvoteResult = await Post.updateOne({ _id: postId }, [
          {
            $set: {
              'upvote.number': { $add: ['$upvote.number', -1] },
            },
          },
          {
            $set: {
              'upvote.users': {
                $filter: {
                  input: '$upvote.users',
                  as: 'user',
                  cond: {
                    $ne: ['$$user', userId],
                  },
                },
              },
            },
          },
        ]);

        if (cancelUpvoteResult.acknowledged === false) {
          throw new Error('cancel downvote fail');
        }

        // const cancelUpvoteFromMotherResult = await Post.updateOne(
        //   { _id: motherPost },
        //   [
        //     {
        //       $set: {
        //         sum_upvotes: { $add: ['$sum_upvotes', -1] },
        //       },
        //     },
        //     {
        //       $set: {
        //         hot: {
        //           $divide: [
        //             {
        //               $add: ['$sum_likes', '$sum_upvotes', '$sum_comments', 1],
        //             },
        //             {
        //               $add: [
        //                 1,
        //                 {
        //                   $dateDiff: {
        //                     startDate: '$publish_date',
        //                     endDate: '$$NOW',
        //                     unit: 'day',
        //                   },
        //                 },
        //               ],
        //             },
        //           ],
        //         },
        //       },
        //     },
        //   ],
        // );

        const cancelUpvoteFromMotherResult = await calculateMotherPostHot(
          motherPost,
          'upvote',
          false,
        );

        if (cancelUpvoteFromMotherResult === false) {
          throw new Error('cancel downvote from mother fail');
        }
      }

      res.json({ message: `${message} post success` });
      return;
    }

    res.status(500).json({ error: 'something is wrong downvoting a post' });
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Down vote a post fail' });
  }
}
