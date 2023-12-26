import '../dotenv';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import {
  expect,
  test,
  describe,
  expectTypeOf,
  // beforeAll,
  afterAll,
} from 'vitest';
import { updateReadBoards, userSchema } from '../models/user';

describe('#get user info', async () => {
  // let User;
  // beforeAll(async () => {
  //   if (!process.env.TEST_DATABASE) {
  //     return;
  //   }
  //   mongoose
  //     .connect(process.env.TEST_DATABASE || 'fail', {})
  //     .then(() => {
  //       console.log('connect to mongoDB.');
  //     })
  //     .catch((err) => {
  //       console.log('conn failed');
  //       console.log(err);
  //     });
  //   const User = mongoose.model('User', userSchema);
  // });

  async function getUserInfo(user: string) {
    mongoose
      .connect(process.env.TEST_DATABASE || 'fail', {})
      .then(() => {
        console.log('connect to mongoDB.');
      })
      .catch((err) => {
        console.log('conn failed');
        console.log(err);
      });
    const User = mongoose.model('User', userSchema);
    const userInfo = await User.findOne({ _id: user });

    return userInfo;
  }

  const data = await getUserInfo('657ae07855dd51035eb6682d');
  const image = data?.image;
  const name = data?.name;
  test('get user data', () => {
    expect(image).toBe('1702632976630.png');
    expect(name).toBe('Joazen Jiang');
    // expectTypeOf({ a: 1 }).toMatchTypeOf<{ a: string }>();
  });
});

describe('#update user read boards', () => {
  const objectId1 = new ObjectId();
  const objectId2 = new ObjectId();
  const objectId3 = new ObjectId();
  const objectId4 = new ObjectId();
  const objectId5 = new ObjectId();

  test('to be array of ObjectId', () => {
    const result = updateReadBoards([], objectId1);
    expectTypeOf(result).toBeArray();
    expectTypeOf(result).toMatchTypeOf<ObjectId[]>();
  });

  test('can be length of 4', () => {
    const result = updateReadBoards(
      [objectId1, objectId2, objectId3],
      objectId4,
    );

    expect(result).length(4);
  });

  test('the last objectId will pull the first out', () => {
    const result = updateReadBoards(
      [objectId1, objectId2, objectId3, objectId4],
      objectId5,
    );

    expect(result).length(4);
    expect(result[3].toString()).toBe(objectId5.toString());
    expect(result[0].toString()).toBe(objectId2.toString());
  });
});

afterAll(async () => {
  mongoose.disconnect();
});
