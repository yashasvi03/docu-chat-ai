/**
 * Database Configuration
 * 
 * This file contains the configuration for connecting to MongoDB.
 * In a real implementation, this would establish a connection to MongoDB.
 * For now, it's a placeholder that simulates a successful connection.
 */

// const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 * Commented out as we're using in-memory storage for now
 */
/*
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
*/

/**
 * For now, we'll export a placeholder function that simulates a successful connection
 * In a real implementation, this would export the connectDB function
 */
const connectDB = async () => {
  console.log('Using in-memory storage instead of MongoDB');
  return {
    connection: {
      host: 'in-memory'
    }
  };
};

module.exports = connectDB;
