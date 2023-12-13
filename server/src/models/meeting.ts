import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export interface MeetingDocument {
  _id: ObjectId;
  status: string;
  users: ObjectId[];
  ratings: number[];
  meeting_comments: string[][];
  role: string[];
  user_intro: string[];
  to_share: string[][];
  to_ask: string[][];
  accept: string[][];
}

export interface AggregationInterface {
  phrase: {
    query: string;
    path: string;
  };
}

interface MustNotObj {
  in: {
    path: string;
    value: ObjectId[];
  };
}

const meetingSchema = new mongoose.Schema<MeetingDocument>({
  status: {
    type: String,
    enum: ['pending', 'checking', 'end', 'fail'],
    default: 'pending',
    required: true,
  },
  users: {
    type: [ObjectId],
    default: undefined,
    required: true,
  },
  ratings: {
    type: [Number],
    default: undefined,
    required: true,
  },
  meeting_comments: {
    type: [[String]],
    default: undefined,
    required: true,
  },
  role: {
    type: [String],
    default: undefined,
    required: true,
  },
  user_intro: {
    type: [String],
    default: undefined,
    required: true,
  },
  to_share: {
    type: [[String]],
    default: undefined,
    required: true,
  },
  to_ask: {
    type: [[String]],
    default: undefined,
    required: true,
  },
  accept: {
    type: [[String]],
    required: true,
  },
});

const Meeting = mongoose.model('Meeting', meetingSchema);

export async function createMeeting(
  user: string,
  role: string,
  rating: number,
  meetingComments: string[],
  userIntro: string,
  toShare: string[],
  toAsk: string[],
) {
  const result = await Meeting.create({
    users: [user],
    role: [role],
    ratings: [rating],
    meeting_comments: [meetingComments],
    user_intro: [userIntro],
    to_share: [toShare],
    to_ask: [toAsk],
  });

  return result;
}

export async function joinMeeting(
  metUsers: ObjectId[],
  user: string,
  role: string,
  rating: number,
  meetingComments: string[],
  userIntro: string,
  toShare: string[],
  toAsk: string[],
) {
  const creatorShouldShare: AggregationInterface[] = [];
  toAsk.forEach((ask) => {
    creatorShouldShare.push({
      phrase: {
        query: `${ask}`,
        path: 'to_share',
      },
    });
  });

  const creatorShouldAsk: AggregationInterface[] = [];
  toShare.forEach((share) => {
    creatorShouldAsk.push({
      phrase: {
        query: `${share}`,
        path: 'to_ask',
      },
    });
  });

  let mustNotArray: MustNotObj[] = [];

  if (metUsers.length > 0) {
    mustNotArray = [
      {
        in: {
          path: 'users',
          value: metUsers,
        },
      },
    ];
  }

  const result = await Meeting.aggregate<MeetingDocument>([
    {
      $search: {
        index: 'meeting',
        compound: {
          must: [
            {
              compound: {
                should: creatorShouldShare,
              },
            },
            {
              compound: {
                should: creatorShouldAsk,
              },
            },
          ],
          should: [],
          mustNot: mustNotArray,
          filter: [
            {
              phrase: {
                query: 'pending',
                path: 'status',
              },
            },
          ],
        },
      },
    },
    {
      $addFields: {
        score: {
          $meta: 'searchScore',
        },
      },
    },
    {
      $sort: {
        score: -1,
      },
    },
    {
      $limit: 1,
    },
  ]);

  // console.log(result);

  if (!result[0]) {
    // create a new one
    return false;
  }
  // else joing the meeting

  const meetingId = result[0]._id;
  const userId = new ObjectId(user);

  await Meeting.updateOne(
    { _id: meetingId },
    {
      $push: {
        users: userId,
        role,
        ratings: rating,
        meeting_comments: meetingComments,
        user_intro: userIntro,
        to_share: toShare,
        to_ask: toAsk,
      },
      status: 'checking',
    },
  );

  // console.log(result);

  return result[0];
}

export default Meeting;
