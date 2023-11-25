import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const MOTHER_POST_PER_PAGE = 20;
const REPLY_POST_PER_PAGE = 10;

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
  // 3 tags the most
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
  // userId
  last_reply: ObjectId,
  //
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

export async function getAutoRecommendedPosts(
  preferenceTags: string[],
  boards: ObjectId[],
  read_posts: ObjectId[],
) {
  const shouldArray = [];
  let scoring = 10;

  preferenceTags.forEach((tag) => {
    shouldArray.push({
      text: {
        query: `"${tag}"`,
        path: 'tags',
        score: {
          boost: {
            value: scoring * 5,
          },
        },
      },
    });

    scoring -= 2;
  });

  shouldArray.push({
    in: {
      value: boards,
      path: 'board',
      score: {
        boost: {
          value: 30,
        },
      },
    },
  });

  const posts = await Post.aggregate([
    {
      $search: {
        index: 'posts',
        compound: {
          must: [],
          should: shouldArray,
          filter: [
            {
              exists: {
                path: 'category',
              },
            },
          ],
        },
      },
    },
    {
      $match: {
        is_delete: false,
      },
    },
    {
      $addFields: {
        score: {
          $meta: 'searchScore',
        },
        time: {
          $dateDiff: {
            startDate: '$$NOW',
            endDate: '$publish_date',
            unit: 'hour',
          },
        },
      },
    },
    {
      $set: {
        score: {
          $cond: {
            if: {
              $in: ['$_id', read_posts],
            },
            then: {
              $add: [
                '$score',
                '$hot',
                {
                  $dateDiff: {
                    startDate: '$$NOW',
                    endDate: '$publish_date',
                    unit: 'hour',
                  },
                },
                {
                  $multiply: [
                    -50,
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
              ],
            },
            else: {
              $add: [
                '$score',
                '$hot',
                {
                  $dateDiff: {
                    startDate: '$$NOW',
                    endDate: '$publish_date',
                    unit: 'hour',
                  },
                },
              ],
            },
          },
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
        last_reply: 1,
        upvote: 1,
        downvote: 1,
        comments: 1,
      },
    },
  ]);

  return posts;
}

export async function getBoardPostsFromDB(boardId: string, paging: number) {
  const board = new ObjectId(boardId);

  const postsOnBoard = await Post.find({
    category: 'mother',
    board,
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

export default Post;
