import 'dotenv';
import S3 from 'aws-sdk/clients/s3';
import fs from 'fs';

require('aws-sdk/lib/maintenance_mode_message').suppress = true;

// import modeMessage from 'aws-sdk/lib/maintenance_mode_message';

// modeMessage.suppress = true;

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

if (!bucketName) {
  throw new Error('no bucket info in env');
}

const uploadS3 = async (file: Express.Multer.File, folder: string) => {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: `${folder}/${file.filename}`,
  };

  let result;
  try {
    result = await s3.upload(uploadParams).promise();
  } catch (err) {
    console.log(err);
  }

  return result;
};

export default uploadS3;
