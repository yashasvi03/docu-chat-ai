/**
 * OpenAI Configuration
 * 
 * This file contains the configuration for the OpenAI API.
 * It initializes the OpenAI client with the API key from environment variables.
 */

const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration for embeddings
const embeddingConfig = {
  model: 'text-embedding-3-small', // OpenAI's embedding model
  dimensions: 1536, // Dimensions of the embedding vectors
};

// Configuration for chat completions
const chatConfig = {
  model: 'gpt-4', // OpenAI's chat model
  temperature: 0.3, // Lower temperature for more deterministic responses
  max_tokens: 1000, // Maximum tokens in the response
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

module.exports = {
  openai,
  embeddingConfig,
  chatConfig
};
