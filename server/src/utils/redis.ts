import * as Redis from 'redis';

const redisClient = Redis.createClient();
try {
  redisClient.connect();
  redisClient.on('error', (err) => {
    console.log(`redis not runnung: ${err}`);
    redisClient.disconnect();
  });
  redisClient.on('connect', () => {
    console.log('redis connected');
  });
} catch (err) {
  console.log(`redis connection fail: ${err}`);
}
export default redisClient;
