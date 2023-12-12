import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

interface TagDocument extends Document {
  _id: ObjectId;
  name: string;
  post_num: number;
  relevant: string[];
}

const tagSchema = new mongoose.Schema<TagDocument>({
  name: {
    type: String,
    unique: true,
    required: [true, 'A tag must have a name'],
  },
  post_num: {
    type: Number,
    required: true,
    default: 1,
  },
  relevant: {
    type: [String],
    default: [],
  },
});

const Tag = mongoose.model('Tag', tagSchema);

export async function addPostTagsToDB(tags: string[]) {
  const arr = tags.map((tag) => {
    const releventTags = tags.filter((el) => el !== tag);

    return {
      updateOne: {
        filter: { name: tag },
        update: {
          $inc: { post_num: 1 },
          $push: { relevant: { $each: releventTags, $slice: -20 } },
        },
        upsert: true,
      },
    };
  });

  await Tag.bulkWrite(arr);
}

export async function getRecommendedTags(search: string) {
  const tags = await Tag.aggregate([
    {
      $search: {
        index: 'autoCompleteTags',
        autocomplete: {
          query: search,
          path: 'name',
          tokenOrder: 'sequential',
        },
      },
    },
    { $sort: { post_num: -1 } },
    { $limit: 10 },
    {
      $project: {
        name: 1,
      },
    },
  ]);

  return tags;
}

export default Tag;
