import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { AggregationInterface } from './meeting';

// { PipelineStage }

const MOTHER_POST_PER_PAGE = 20;
const REPLY_POST_PER_PAGE = 10;
const SEARCH_POST_PER_PAGE = 20;

const LIKE_COMMENT_UPVOTE_HOT_SCORE = 100;

interface PostDocument {
  is_delete: boolean;
  category: string;
  title: string;
  publish_date: Date;
  update_date: Date;
  author: ObjectId;
  content: string;
  edit: { date: Date; content: string }[];
  board: ObjectId;
  mother_post: ObjectId;
  tags: string[];
  liked: { number: number; users: ObjectId[] };
  sum_likes: number;
  sum_upvotes: number;
  sum_comments: number;
  sum_reply: number;
  // userId
  last_reply: ObjectId;
  upvote: { number: number; users: ObjectId[] };
  downvote: { number: number; users: ObjectId[] };
  useful: number;
  comments: {
    number: number;
    data: {
      user: ObjectId;
      content: string;
      time: Date;
      like: {
        number: number;
        users: ObjectId[];
      };
    }[];
  };
  hot: number;
}

const postSchema = new mongoose.Schema<PostDocument>({
  is_delete: {
    type: Boolean,
    default: false,
    required: true,
  },
  category: {
    // native || mother || reply
    type: String,
    enum: ['native', 'mother', 'reply'],
    required: true,
  },
  title: String,
  publish_date: {
    type: Date,
    required: true,
  },
  update_date: { type: Date, required: true },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  edit: [
    {
      date: Date,
      content: String,
    },
  ],
  board: ObjectId,
  mother_post: ObjectId,
  // 4 tags the most
  tags: {
    type: [String],
    required: [true, 'A post must contain a tag'],
  },
  liked: {
    number: { type: Number, default: 0 },
    users: { type: [ObjectId], default: [] },
  },
  // only on mother post
  sum_likes: { type: Number, default: 0 },
  sum_upvotes: { type: Number, default: 0 },
  sum_comments: { type: Number, default: 0 },
  sum_reply: { type: Number, default: 0 },
  last_reply: ObjectId,
  upvote: {
    number: { type: Number, default: 0 },
    users: { type: [ObjectId], default: [] },
  },
  downvote: {
    number: { type: Number, default: 0 },
    users: { type: [ObjectId], default: [] },
  },
  useful: Number,
  comments: {
    number: { type: Number, default: 0 },
    data: [
      {
        user: ObjectId,
        content: String,
        time: Date,
        like: {
          number: Number,
          users: [ObjectId],
        },
      },
    ],
  },
  hot: { type: Number, default: 0 },
});

const Post = mongoose.model('Post', postSchema);

const CALCULATE_POST_HOT_QUERY = {
  $set: {
    hot: {
      $multiply: [
        LIKE_COMMENT_UPVOTE_HOT_SCORE,
        { $add: ['$sum_likes', '$sum_upvotes', '$sum_comments', 1] },
      ],
    },
  },
};

export async function getAutoRecommendedPosts(
  preferenceTags: string[],
  read_posts: ObjectId[],
) {
  const aggregateArray = [];
  aggregateArray.push(
    {
      $match: {
        is_delete: false,
      },
    },
    {
      $match: {
        $or: [
          {
            category: 'mother',
          },
          {
            category: 'native',
          },
        ],
      },
    },
    {
      $addFields: {
        score: 0,
        time: {
          $dateDiff: {
            startDate: '$$NOW',
            endDate: '$publish_date',
            unit: 'hour',
          },
        },
      },
    },
  );

  let scoring = 100;

  preferenceTags.forEach((tag) => {
    aggregateArray.push({
      $set: {
        score: {
          $cond: [
            {
              $in: [tag, '$tags'],
            },
            {
              $add: ['$score', scoring * 20],
            },
            {
              $add: ['$score', 0],
            },
          ],
        },
      },
    });

    scoring -= 10;
  });

  aggregateArray.push(
    {
      $set: {
        score: {
          $cond: [
            { $in: ['$_id', read_posts] },
            {
              $add: [
                '$score',
                '$hot',
                {
                  $multiply: [
                    -300,
                    {
                      $size: {
                        $filter: {
                          input: read_posts,
                          as: 'post',
                          cond: { $eq: ['$$post', '$_id'] },
                        },
                      },
                    },
                  ],
                },
                // {
                //   $multiply: [
                //     200,
                //     {
                //       $dateDiff: {
                //         startDate: '$$NOW',
                //         endDate: '$update_date',
                //         unit: 'day',
                //       },
                //     },
                //   ],
                // },
              ],
            },
            {
              $add: [
                '$score',
                '$hot',
                // {
                //   $multiply: [
                //     200,
                //     {
                //       $dateDiff: {
                //         startDate: '$$NOW',
                //         endDate: '$update_date',
                //         unit: 'day',
                //       },
                //     },
                //   ],
                // },
              ],
            },
          ],
        },
      },
    },
    {
      $sort: {
        score: -1,
      },
    },
    {
      $limit: 50,
    },
    {
      $project: {
        _id: 1,
        category: 1,
        board: 1,
        hot: 1,
        score: 1,
        tags: 1,
        time: 1,
        title: 1,
        author: 1,
        publish_date: 1,
        update_date: 1,
        content: 1,
        edit: 1,
        liked: 1,
        sum_likes: 1,
        sum_upvotes: 1,
        sum_comments: 1,
        sum_reply: 1,
        last_reply: 1,
        upvote: 1,
        downvote: 1,
        comments: 1,
      },
    },
  );

  // @ts-ignore
  const posts = await Post.aggregate(aggregateArray);

  return posts;
}

export async function getCustomizedPostsFromDB(
  tags: string[],
  preferenceTags: string[],
  read_posts: ObjectId[],
) {
  const aggregateArray = [];
  aggregateArray.push(
    {
      $match: {
        is_delete: false,
      },
    },
    {
      $match: {
        $or: [
          {
            category: 'mother',
          },
          {
            category: 'native',
          },
        ],
        tags: { $in: tags },
      },
    },
    {
      $addFields: {
        score: 0,
        time: {
          $dateDiff: {
            startDate: '$$NOW',
            endDate: '$publish_date',
            unit: 'hour',
          },
        },
      },
    },
  );

  let scoring = 100;

  preferenceTags.forEach((tag) => {
    aggregateArray.push({
      $set: {
        score: {
          $cond: [
            {
              $in: [tag, '$tags'],
            },
            {
              $add: ['$score', scoring * 20],
            },
            {
              $add: ['$score', 0],
            },
          ],
        },
      },
    });

    scoring -= 10;
  });

  aggregateArray.push(
    {
      $set: {
        score: {
          $cond: [
            { $in: ['$_id', read_posts] },
            {
              $add: [
                '$score',
                '$hot',
                {
                  $multiply: [
                    -300,
                    {
                      $size: {
                        $filter: {
                          input: read_posts,
                          as: 'post',
                          cond: { $eq: ['$$post', '$_id'] },
                        },
                      },
                    },
                  ],
                },
                // {
                //   $multiply: [
                //     200,
                //     {
                //       $dateDiff: {
                //         startDate: '$$NOW',
                //         endDate: '$update_date',
                //         unit: 'day',
                //       },
                //     },
                //   ],
                // },
              ],
            },
            {
              $add: [
                '$score',
                '$hot',
                // {
                //   $multiply: [
                //     200,
                //     {
                //       $dateDiff: {
                //         startDate: '$$NOW',
                //         endDate: '$update_date',
                //         unit: 'day',
                //       },
                //     },
                //   ],
                // },
              ],
            },
          ],
        },
      },
    },
    {
      $sort: {
        score: -1,
      },
    },
    {
      $limit: 50,
    },
    {
      $project: {
        _id: 1,
        category: 1,
        board: 1,
        hot: 1,
        score: 1,
        tags: 1,
        time: 1,
        title: 1,
        author: 1,
        publish_date: 1,
        update_date: 1,
        content: 1,
        edit: 1,
        liked: 1,
        sum_likes: 1,
        sum_upvotes: 1,
        sum_comments: 1,
        sum_reply: 1,
        last_reply: 1,
        upvote: 1,
        downvote: 1,
        comments: 1,
      },
    },
  );

  // @ts-ignore
  const posts = await Post.aggregate(aggregateArray);

  return posts;
}

export async function getBoardPostsFromDB(boardId: string, paging: number) {
  const board = new ObjectId(boardId);

  const postsOnBoard = await Post.find({
    category: 'mother',
    board,
    is_delete: false,
  })
    .sort({ update_date: -1 })
    .skip(paging * MOTHER_POST_PER_PAGE)
    .limit(MOTHER_POST_PER_PAGE + 1);

  let nextPage;
  if (postsOnBoard.length > MOTHER_POST_PER_PAGE) {
    nextPage = true;
  } else {
    nextPage = false;
  }

  const posts = postsOnBoard.slice(0, MOTHER_POST_PER_PAGE);

  return { posts, nextPage };
}

export async function getMotherAndReplyPostsFromDB(
  motherPostId: ObjectId,
  paging: number,
) {
  const replyPosts = await Post.find({
    $or: [{ _id: motherPostId }, { mother_post: motherPostId }],
  })
    .sort({ _id: 1 })
    .skip(paging * REPLY_POST_PER_PAGE)
    .limit(REPLY_POST_PER_PAGE + 1);

  let nextPage;
  if (replyPosts.length > REPLY_POST_PER_PAGE) {
    nextPage = true;
  } else {
    nextPage = false;
  }

  const posts = replyPosts.slice(0, REPLY_POST_PER_PAGE);

  return { posts, nextPage };
}

export async function getPostFromDB(post: string) {
  const postInfo = await Post.findOne({ _id: post });
  return postInfo;
}

export async function searchPostsFromDB(
  mustArray: string[],
  shouldArray: string[],
  tagArray: string[],
  paging: number,
) {
  const postTitleShouldArray: AggregationInterface[] = [];
  const postContentMustArray: AggregationInterface[] = [];
  const postContentShouldArray: AggregationInterface[] = [];
  const tagShouldArray: AggregationInterface[] = [];

  mustArray.forEach((must) => {
    postContentMustArray.push({
      phrase: {
        query: `${must}`,
        path: 'content',
      },
    });
    postTitleShouldArray.push({
      phrase: {
        query: `${must}`,
        path: 'title',
      },
    });
  });

  shouldArray.forEach((should) => {
    postContentShouldArray.push({
      phrase: {
        query: `${should}`,
        path: 'content',
      },
    });
    postTitleShouldArray.push({
      phrase: {
        query: `${should}`,
        path: 'title',
      },
    });
  });

  const shouldAllArray = [
    ...postTitleShouldArray,
    ...postContentShouldArray,
    ...postTitleShouldArray,
  ];

  tagArray.forEach((tag) => {
    tagShouldArray.push({
      phrase: {
        query: `${tag}`,
        path: 'tags',
      },
    });
  });

  const mustAllArray = [];
  if (tagShouldArray.length > 0) {
    mustAllArray.push({
      compound: {
        should: tagShouldArray,
      },
    });
  }

  if (postContentMustArray.length > 0) {
    mustAllArray.push({
      compound: {
        must: postContentMustArray,
      },
    });
  }

  const result = await Post.aggregate<PostDocument>([
    {
      $search: {
        index: 'postSearch',
        compound: {
          must: mustAllArray,
          should: shouldAllArray,
          mustNot: [],
        },
      },
    },
    {
      $match: {
        is_delete: false,
        category: { $ne: 'reply' },
      },
    },
    {
      $skip: SEARCH_POST_PER_PAGE * paging,
    },
    {
      $limit: SEARCH_POST_PER_PAGE + 1,
    },
  ]);

  let ifNextPage = false;
  let returnPosts;
  if (result.length > SEARCH_POST_PER_PAGE) {
    // next page exist
    ifNextPage = true;
    returnPosts = result.slice(0, SEARCH_POST_PER_PAGE);
  } else {
    returnPosts = result;
  }

  return { posts: returnPosts, ifNextPage };
}

export async function calculateMotherPostHot(
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

  const num = increase === true ? 1 : -1;

  const calculateResult = await Post.updateOne({ _id: postId }, [
    {
      $set: {
        [field]: { $add: [`$${field}`, num] },
      },
    },
    CALCULATE_POST_HOT_QUERY,
  ]);

  if (calculateResult.modifiedCount !== 1) {
    throw Error('calculate hot fail');
  }

  return true;
}

export async function changeMotherPostLastUpdateTime(
  motherPost: string,
  updateDate: Date,
  lastReplier: string,
) {
  const updateMotherResult = await Post.updateOne(
    { _id: motherPost },
    {
      $set: {
        update_date: updateDate,
        last_reply: lastReplier,
      },
      $inc: { sum_reply: 1 },
    },
  );

  if (updateMotherResult.acknowledged === false) {
    throw new Error(
      'mother post deoes not exist or something is wrong updating it',
    );
  }
}

export async function commentPostToDB(
  postId: string,
  userId: string,
  content: string,
  publishDate: Date,
) {
  const commentResult = await Post.updateOne({ _id: postId }, [
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
                like: { number: 0, users: [] },
              },
            ],
          ],
        },
        'comments.number': { $add: ['$comments.number', 1] },
        sum_comments: { $add: ['$sum_comments', 1] },
      },
    },
    CALCULATE_POST_HOT_QUERY,
  ]);

  if (commentResult.acknowledged === false) {
    throw new Error('Create comment fail');
  }
}

export default Post;
