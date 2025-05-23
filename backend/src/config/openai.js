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
  model: 'o4-mini-high', // OpenAI's o4-mini-high model for RAG applications
  temperature: 0.2, // Lower temperature for more deterministic responses in RAG
  max_tokens: 1500, // Increased max tokens for comprehensive answers
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  // Logit bias to discourage first-person hallucinations
  logit_bias: {
    // Token IDs for phrases like "I think", "In my opinion", etc. would be added here
    // This is a placeholder and would need actual token IDs
  }
};

// Configuration for RAG (Retrieval Augmented Generation)
const ragConfig = {
  similarityThreshold: 0.25, // Minimum cosine similarity score for relevant chunks
  maxChunks: 8, // Maximum number of chunks to include in the prompt
  chunkOverlap: 0.2, // 20% overlap between chunks
  chunkSize: 800, // Target token count per chunk
  systemPrompt: `You are DocuChat AI, a helpful assistant that answers questions based ONLY on the provided document excerpts.
- If the answer is not contained within the provided excerpts, respond with "I don't have enough information to answer that question."
- Do not use prior knowledge or make assumptions beyond what's in the excerpts.
- Always cite your sources using [Doc Title, Page X] format.
- If multiple documents support your answer, cite all of them.
- Be concise and accurate.`
};

module.exports = {
  openai,
  embeddingConfig,
  chatConfig,
  ragConfig
};
