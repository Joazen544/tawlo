import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

interface BoardDocument {
  name: string;
  admin: ObjectId;
}

const boardSchema = new mongoose.Schema<BoardDocument>({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  admin: ObjectId,
});

const Board = mongoose.model('Board', boardSchema);

export async function getAllBoards() {
  const allBoards = await Board.find();
  return allBoards;
}

export async function getBoardName(id: string) {
  const name = await Board.findOne({ _id: id });

  return name;
}

export default Board;
