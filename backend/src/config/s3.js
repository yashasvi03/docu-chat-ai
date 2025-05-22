/**
 * AWS S3 Configuration
 * 
 * This file contains the configuration for AWS S3.
 * It initializes the AWS S3 client with the credentials from environment variables.
 */

const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Create S3 service object
const s3 = new AWS.S3();

// S3 bucket name
const bucketName = process.env.AWS_S3_BUCKET;

/**
 * Upload a file to S3
 * @param {Buffer} buffer - File buffer
 * @param {string} key - S3 key (file path)
 * @param {string} contentType - File content type
 * @returns {Promise<string>} - S3 URL
 */
const uploadToS3 = async (buffer, key, contentType) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType
  };
  
  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

/**
 * Delete a file from S3
 * @param {string} key - S3 key (file path)
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key
  };
  
  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
};

/**
 * Get a file from S3
 * @param {string} key - S3 key (file path)
 * @returns {Promise<Buffer>} - File buffer
 */
const getFromS3 = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key
  };
  
  try {
    const data = await s3.getObject(params).promise();
    return data.Body;
  } catch (error) {
    console.error('Error getting from S3:', error);
    throw error;
  }
};

module.exports = {
  s3,
  bucketName,
  uploadToS3,
  deleteFromS3,
  getFromS3
};
