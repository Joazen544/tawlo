import mongoose from 'mongoose';
import { ObjectId, Timestamp } from 'mongodb';

const messageSchema = new mongoose.Schema({
  group: ObjectId,
  from: ObjectId,
  to: ObjectId,
  time: Timestamp,
  is_removed: Boolean,
});

export default mongoose.model('Message', messageSchema);
