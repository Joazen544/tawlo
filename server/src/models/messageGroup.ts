import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const messageGroupSchema = new mongoose.Schema({
  users: [ObjectId],
});
export default mongoose.model('MessageGroup', messageGroupSchema);
