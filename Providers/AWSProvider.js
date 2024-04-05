const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client, S3, GetObjectCommand } = require("@aws-sdk/client-s3");
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

const client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});
const uploadToS3 = async (docName, content) => {
  try {
    const response = await new Upload({
      client: client,
      params: {
        ACL: "public-read",
        Bucket,
        Key: docName,
        Body: content,
      },
      tags: [], // optional tags
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false, // optional manually handle dropped parts
    }).done();
    console.log(response.Location); 
    return response.Location;
  } catch (err) {
    console.log(err);
  }
};

const getFromS3 = async (docName) => {
  const command = new GetObjectCommand({
    Bucket: Bucket,
    Key: docName,
  });
  try {
    // console.log("searching for", docName);
    const response = await client.send(command);
    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const arrayBuffer = response.Body;
    return arrayBuffer;
  } catch (err) {
    // console.error(err, err.Code);
    return null;
  }
};


module.exports = { uploadToS3, getFromS3 };
