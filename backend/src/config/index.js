/**
 * Configuration Index
 * 
 * This file exports all the configurations from the config directory.
 * It serves as a central point for accessing all configurations.
 */

const { sequelize, connectDB } = require('./database');
const { openai, embeddingConfig, chatConfig } = require('./openai');
const { s3, bucketName, uploadToS3, deleteFromS3, getFromS3 } = require('./s3');
const models = require('../models');

// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d'
};

// Server configuration
const serverConfig = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

// Vector database configuration
const vectorDbConfig = {
  similarityThreshold: 0.25, // Minimum similarity score for relevant documents
  maxResults: 5 // Maximum number of results to return
};

// Google OAuth configuration
const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
};

// Export all configurations
module.exports = {
  sequelize,
  connectDB,
  models,
  openai,
  embeddingConfig,
  chatConfig,
  s3,
  bucketName,
  uploadToS3,
  deleteFromS3,
  getFromS3,
  jwtConfig,
  serverConfig,
  vectorDbConfig,
  googleOAuthConfig
};
