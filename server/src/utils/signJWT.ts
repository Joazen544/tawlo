import jwt from 'jsonwebtoken';

const JWT_KEY = process.env.JWT_KEY || '';
export const EXPIRE_TIME = 600 * 60;

export default function signJWT(userId: String) {
  return new Promise((resolve, reject) => {
    jwt.sign({ userId }, JWT_KEY, { expiresIn: EXPIRE_TIME }, (err, token) => {
      if (err) {
        reject(err);
      }
      resolve(token);
    });
  });
}
