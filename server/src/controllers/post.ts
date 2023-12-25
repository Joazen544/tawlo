import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Post, * as postModel from '../models/post';
import * as userModel from '../models/user';
import * as tagModel from '../models/tag';
import { sendNotificationThroughSocket } from './socket';
import { ValidationError } from '../utils/errorHandler';
import catchAsync from '../utils/catchAsync';

export const createPost = catchAsync(async (req: Request, res: Response) => {
  const { category, user, title, content, board, motherPost } = req.body;
  const tags = req.body.tags as string;

  if (!['native', 'mother', 'reply'].includes(category)) {
    res.status(400).json({
      error: 'The category should either be native, mother or reply',
    });
    return;
  }

  if (!content) {
    res.status(400).json({
      error: 'A post needs to have content',
    });
    return;
  }

  const userId = new ObjectId(user);
  const publishDate = new Date();

  let postData;
  let tagsArray: string[] = [];

  if (category === 'reply') {
    const motherPostInfo = await Post.findOne({ _id: motherPost });

    if (!motherPostInfo) {
      console.log('mother post does not exist');
      res.status(400).json({ error: 'mother post does not exist' });
      return;
    }

    await postModel.changeMotherPostLastUpdateTime(
      motherPost,
      publishDate,
      userId,
    );

    tagsArray = motherPostInfo.tags;
    const postBoard = motherPostInfo.board;

    postData = await Post.create({
      category,
      author: userId,
      content,
      publish_date: publishDate,
      update_date: publishDate,
      tags: tagsArray,
      board: postBoard,
      mother_post: motherPost,
    });

    if (motherPostInfo.author.toString() !== userId.toString()) {
      userModel.addNotification(
        motherPostInfo.author,
        'reply_post',
        userId,
        postData._id,
      );

      sendNotificationThroughSocket(
        motherPostInfo.author.toString(),
        'reply_post',
        '有人回覆了你的貼文',
        userId.toString(),
        postData._id.toString(),
      );
    }
  }

  if (category === 'native') {
    if (!tags) {
      res.status(400).json({ error: 'A native post should have tag' });
      return;
    }

    tagsArray = Array.isArray(tags)
      ? tags.map((tag) => tag.toLowerCase())
      : [tags.toLowerCase()].filter(Boolean);

    postData = await Post.create({
      category,
      author: userId,
      content,
      publish_date: publishDate,
      update_date: publishDate,
      tags: tagsArray,
    });
  }

  if (category === 'mother') {
    if (!title) {
      res.status(400).json({ error: 'A mother post should have title' });
      return;
    }
    if (!board) {
      res.status(400).json({ error: 'A mother post should have a board' });
      return;
    }
    if (!tags) {
      res.status(400).json({ error: 'A mother post should have tag' });
      return;
    }

    tagsArray = Array.isArray(tags)
      ? tags.map((tag) => tag.toLowerCase())
      : [tags.toLowerCase()].filter(Boolean);

    postData = await Post.create({
      category,
      author: userId,
      title,
      content,
      publish_date: publishDate,
      update_date: publishDate,
      tags: tagsArray,
      board,
    });
  }

  try {
    tagModel.addPostTagsToDB(tagsArray);
  } catch (err) {
    console.log(err);
    console.log('something goes wrong adding post tags to DB');
  }

  res.json({
    postData,
  });
});

export const commentPost = catchAsync(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { content, user } = req.body;
  const userId = new ObjectId(user);
  const publishDate = new Date();

  const commentTarget = await Post.findOne({ _id: postId });

  if (commentTarget === null) {
    throw Error('Comment post does not exist');
  }

  const postCategory = commentTarget.category;
  let motherPost;
  if (commentTarget.mother_post) {
    motherPost = commentTarget.mother_post.toString();
  }

  userModel.updateUserAction(userId, commentTarget.tags, commentTarget.board);

  await postModel.commentPost(postId, userId, content, publishDate);

  if (postCategory === 'reply') {
    if (!motherPost) {
      throw Error('reply post must have mother post id');
    }

    await postModel.calculateMotherPostHot(motherPost, 'comment', true);
  }

  if (commentTarget.author.toString() !== userId.toString()) {
    userModel.addNotification(
      commentTarget.author,
      'comment_post',
      userId,
      commentTarget._id,
    );

    sendNotificationThroughSocket(
      commentTarget.author.toString(),
      'comment_post',
      '有人在你的貼文留言',
      userId.toString(),
      commentTarget._id.toString(),
    );
  }

  res.json({ message: 'Add comment success' });
});

export const likePost = catchAsync(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { user, like } = req.body;
  const userId = new ObjectId(user);

  if (![true, false].includes(like)) {
    throw Error('like should be either true or false');
  }

  const likeTarget = await Post.findOne({ _id: postId });
  if (likeTarget === null) throw Error('like target post does not exist');
  if (likeTarget.category !== 'native') throw Error('target not native');

  const ifAlreadyLike = likeTarget.liked?.users?.includes(userId);

  if (like && ifAlreadyLike) throw Error('user already liked the post');
  if (!like && !ifAlreadyLike) throw Error('user did not like the post');

  await postModel.handlelikePost(userId, postId, like);
  userModel.updateUserAction(userId, likeTarget.tags, likeTarget.board);

  if (likeTarget.author.toString() !== userId.toString() && like === true) {
    userModel.addNotification(
      likeTarget.author,
      'like_post',
      userId,
      likeTarget._id,
    );

    sendNotificationThroughSocket(
      likeTarget.author.toString(),
      'like_post',
      '有人喜歡你的貼文',
      userId.toString(),
      likeTarget._id.toString(),
    );
  }

  res.json({ message: `like post success: ${like}` });
});

export const upvotePost = catchAsync(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { user, upvote } = req.body;
  const userId = new ObjectId(user);

  if (![true, false].includes(upvote)) {
    throw Error('upvote should be either true or false');
  }

  const upvoteTarget = await Post.findOne({ _id: postId });

  if (upvoteTarget === null) throw Error('upvote target post does not exist');

  userModel.updateUserAction(userId, upvoteTarget.tags, upvoteTarget.board);

  const ifAlreadyUpvote = upvoteTarget.upvote.users.includes(userId);
  const ifAlreadyDownVote = upvoteTarget.downvote.users.includes(userId);

  if (upvote && ifAlreadyUpvote) throw Error('user already upvoted the post');
  if (!upvote && !ifAlreadyUpvote) throw Error('user not upvote the post');

  const motherPost = upvoteTarget.mother_post?.toString();

  await postModel.handleVotePost(
    userId,
    upvoteTarget._id,
    true,
    upvote,
    upvoteTarget.category,
    ifAlreadyDownVote,
    motherPost,
  );

  if (upvoteTarget.author.toString() !== userId.toString()) {
    userModel.addNotification(
      upvoteTarget.author,
      'upvote_post',
      userId,
      upvoteTarget._id,
    );

    sendNotificationThroughSocket(
      upvoteTarget.author.toString(),
      'upvote_post',
      '有人覺得你的貼文有用',
      userId.toString(),
      upvoteTarget._id.toString(),
    );
  }

  res.json({ message: `upvote post success ${upvote}` });
});

export const downvotePost = catchAsync(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { user, downvote } = req.body;
  const userId = new ObjectId(user);

  if (![true, false].includes(downvote)) {
    throw Error('upvote should be either true or false');
  }

  const downvoteTarget = await Post.findOne({ _id: postId });

  if (downvoteTarget === null) throw Error('target post does not exist');

  userModel.updateUserAction(userId, downvoteTarget.tags, downvoteTarget.board);

  const ifAlreadyUpvote = downvoteTarget.upvote.users.includes(userId);
  const ifAlreadyDownVote = downvoteTarget.downvote.users.includes(userId);

  if (downvote && ifAlreadyDownVote) throw Error('already downvoted');
  if (!downvote && !ifAlreadyDownVote) throw Error('not downvoted the post');

  const motherPost = downvoteTarget.mother_post?.toString();

  await postModel.handleVotePost(
    userId,
    downvoteTarget._id,
    false,
    downvote,
    downvoteTarget.category,
    ifAlreadyUpvote,
    motherPost,
  );

  res.status(500).json({ error: 'something is wrong downvoting a post' });
});

export const getRecommendPosts = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = req.body;

    const userId = new ObjectId(user);
    const userInfo = (await userModel.getUserPreference(
      userId,
    )) as userModel.UserDocument;

    let preferenceTags;
    if (userInfo) {
      preferenceTags = userInfo.preference_tags.map(
        (tag) => tag.name,
      ) as string[];
    } else {
      throw Error('No such user, something wrong getting tags');
    }

    const posts = await postModel.getRecommendedPosts(
      preferenceTags,
      userInfo.read_posts,
      'auto',
      undefined,
    );

    res.json(posts);
  },
);

export const getCustomizedPosts = catchAsync(
  async (req: Request, res: Response) => {
    const { user } = req.body;
    const tags = req.query.tags as string;
    if (!tags) {
      res.status(400).json({ error: 'no tags' });
      return;
    }
    const userInfo = (await userModel.getUserPreference(
      user,
    )) as userModel.UserDocument;

    let tagsArray: string[] = [];
    if (tags !== undefined) {
      tagsArray = Array.isArray(tags) ? tags : [tags].filter(Boolean);
    }

    const preferenceTags = userInfo.preference_tags.map(
      (tag) => tag.name,
    ) as string[];

    const posts = await postModel.getRecommendedPosts(
      preferenceTags,
      userInfo.read_posts,
      'customized',
      tagsArray,
    );

    res.json(posts);
  },
);

export const getPostsOnBoard = catchAsync(
  async (req: Request, res: Response) => {
    const { boardId } = req.params;
    let paging;
    if (req.query.paging && !Number.isNaN(req.query.paging)) {
      paging = +req.query.paging as number;
    } else if (Number.isNaN(req.query.paging)) {
      throw new ValidationError('paging must be type number');
    } else {
      paging = 0;
    }

    const result = await postModel.getBoardPosts(boardId, paging);

    res.json({ posts: result.posts, nextPage: result.nextPage });
  },
);

export const getMotherAndReplies = catchAsync(
  async (req: Request, res: Response) => {
    const motherPost = req.query.id;
    if (!motherPost || typeof motherPost !== 'string') {
      throw new ValidationError('There should be mother post id');
    }

    const motherPostInfo = await Post.findOne({ _id: motherPost });

    if (!motherPostInfo) {
      res.status(400).json({ error: 'Mother post does not exist' });
      return;
    }

    if (motherPostInfo.is_delete === true) {
      res.status(404).json({ error: 'Mother post was deleted' });
      return;
    }

    let paging;
    if (req.query.paging && !Number.isNaN(req.query.paging)) {
      paging = +req.query.paging as number;
    } else if (Number.isNaN(req.query.paging)) {
      throw new ValidationError('paging must be type number');
    } else {
      paging = 0;
    }

    const motherPostId = new ObjectId(motherPost);

    const postsInfo = await postModel.getMotherAndReplyPosts(
      motherPostId,
      paging,
    );

    postsInfo.posts = postsInfo.posts.filter(
      (post) => post.is_delete === false,
    );

    res.json(postsInfo);
  },
);

export const getPost = catchAsync(async (req: Request, res: Response) => {
  const id = req.query.id as string;

  if (!id) {
    res.status(400).json({ error: 'post id should be in req body' });
    return;
  }

  const postInfo = await postModel.getPost(id);
  if (!postInfo) {
    res.status(400).json({ error: 'post does not exist' });
    return;
  }

  if (postInfo.is_delete === true) {
    res
      .status(404)
      .json({ status: 'deleted', message: 'the post was deleted' });
    return;
  }

  res.json(postInfo);
});

export const deletePost = catchAsync(async (req: Request, res: Response) => {
  const { user } = req.body;
  const { id } = req.query;

  if (!id) {
    res.status(400).json({ error: 'post id should be in query' });
    return;
  }

  const targetPost = await Post.findOne({ _id: id });

  if (!targetPost) {
    res.status(400).json({ error: 'target post does not exist' });
    return;
  }

  if (targetPost.author.toString() !== user) {
    res
      .status(403)
      .json({ message: 'user is not author, can not delete the post' });
    return;
  }

  await Post.updateOne({ _id: id }, { $set: { is_delete: true } });

  res.json({ message: 'post deleted' });
});

export const getAutoTags = catchAsync(async (req: Request, res: Response) => {
  const { search } = req.query;

  if (!search) {
    res.status(400).json({ error: 'search missing' });
    return;
  }

  if (typeof search !== 'string') {
    res.status(400).json({ error: 'search invalid' });
    return;
  }

  const tags = await tagModel.getAutoCompleteTags(search);

  res.json(tags);
});

export const getHotTags = catchAsync(async (_req: Request, res: Response) => {
  const tags = await tagModel.getHotTagsFromDB();

  res.json(tags);
});

export const getRelevantTags = catchAsync(
  async (req: Request, res: Response) => {
    const { tag } = req.query;

    if (!tag) {
      res.status(400).json({ error: 'tag undefined' });
      return;
    }

    if (typeof tag !== 'string') {
      res.status(400).json({ error: 'tag is not string' });
      return;
    }

    const tags = await tagModel.getRelevantTagsFromDB(tag);

    if (tags === 'error') {
      res.status(400).json({ error: 'tag not found' });
      return;
    }

    const obj = new Map();
    const returnArray: string[] = [];

    tags.forEach((eachTag) => {
      if (!obj.get(eachTag)) {
        obj.set(eachTag, 1);
      } else if (obj.get(eachTag) === 1) {
        returnArray.push(eachTag);
        obj.set(eachTag, 2);
      }
    });
    res.json(returnArray);
  },
);

export const searchPost = catchAsync(async (req: Request, res: Response) => {
  if (!req.query.should && !req.query.must) {
    res.status(400).json({ error: 'search missing' });
    return;
  }

  let paging;

  if (req.query.paging && !Number.isNaN(req.query.paging)) {
    paging = +req.query.paging as number;
  } else if (Number.isNaN(req.query.paging)) {
    throw new ValidationError('paging must be type number');
  } else {
    paging = 0;
  }

  const should = req.query.should as string;
  const must = req.query.must as string;
  const tags = req.query.tags as string;

  let shouldArray: string[] = [];
  if (should !== undefined) {
    shouldArray = Array.isArray(should) ? should : [should].filter(Boolean);
  }

  let mustArray: string[] = [];
  if (must !== undefined) {
    mustArray = Array.isArray(must) ? must : [must].filter(Boolean);
  }

  let tagArray: string[] = [];
  if (tags !== undefined) {
    tagArray = Array.isArray(tags) ? tags : [tags].filter(Boolean);
  }

  if (
    !shouldArray.every((item) => typeof item === 'string') ||
    !mustArray.every((item) => typeof item === 'string') ||
    !tagArray.every((item) => typeof item === 'string')
  ) {
    res.status(400).json({
      error: '"should" and "must" "tags" must be strings or arrays of strings',
    });
    return;
  }

  const result = await postModel.searchPosts(
    mustArray,
    shouldArray,
    tagArray,
    paging,
  );

  res.json({ posts: result.posts, nextPage: result.ifNextPage });
});
