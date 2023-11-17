import jwt from 'jsonwebtoken';

const JWT_KEY = process.env.JWT_KEY || '';
export const EXPIRE_TIME = 600 * 60;

export function signJWT(userId: string) {
  return new Promise((resolve, reject) => {
    jwt.sign({ userId }, JWT_KEY, { expiresIn: EXPIRE_TIME }, (err, token) => {
      if (err) {
        reject(err);
      }
      resolve(token);
    });
  });
}

export function verifyJWT(token: string) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_KEY, (err, user) => {
      if (err) {
        reject(new Error('The token is expired or wrong'));
      } else {
        resolve(user);
      }
    });
  });
}
