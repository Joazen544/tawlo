import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

interface MeetingDocument {
  _id: ObjectId;
  status: string;
  users: ObjectId[];
  role: string[];
  user_intro: string[];
  to_share: string[][];
  to_ask: string[][];
}

const meetingSchema = new mongoose.Schema<MeetingDocument>({
  status: {
    type: String,
    enum: ['pending', 'end', 'meeting'],
    default: 'pending',
    required: true,
  },
  users: {
    type: [ObjectId],
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
});

const Meeting = mongoose.model('Meeting', meetingSchema);

export async function createMeetingToDB(
  user: string,
  role: string,
  userIntro: string,
  toShare: string,
  toAsk: string,
) {
  const result = await Meeting.create({
    users: [user],
    role: [role],
    user_intro: [userIntro],
    to_share: [toShare],
    to_ask: [toAsk],
  });

  return result;
}

export default Meeting;
