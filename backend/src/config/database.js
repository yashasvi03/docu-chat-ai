/**
 * Database Configuration
 * 
 * This file contains the configuration for connecting to PostgreSQL.
 * It initializes Sequelize with the database credentials from environment variables.
 */

const { Sequelize } = require('sequelize');
const { Vector } = require('pgvector');

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'docuchat',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'postgres',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.POSTGRES_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

/**
 * Connect to PostgreSQL
 * @returns {Promise<Sequelize>} - Sequelize instance
 */
const connectDB = async () => {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('PostgreSQL Connected');
    
    // Initialize pgvector extension if it doesn't exist
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector');
    
    // Sync models with database
    if (process.env.NODE_ENV === 'development') {
      // In development, we can sync the models with the database
      // This will create tables if they don't exist
      // Note: In production, you should use migrations instead
      await sequelize.sync({ alter: true });
      console.log('Database synced');
    }
    
    return sequelize;
  } catch (error) {
    console.error(`Error connecting to PostgreSQL: ${error.message}`);
    
    // In development mode, fall back to in-memory storage
    if (process.env.NODE_ENV === 'development') {
      console.log('Falling back to in-memory storage');
      return {
        connection: {
          host: 'in-memory'
        },
        inMemory: true
      };
    }
    
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB,
  Vector
};
