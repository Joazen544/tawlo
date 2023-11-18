import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  admin: ObjectId,
});

export default mongoose.model('Board', boardSchema);
