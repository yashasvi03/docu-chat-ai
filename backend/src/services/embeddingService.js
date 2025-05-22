const { OpenAI } = require('openai');

// Import services
const documentService = require('./documentService');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// In-memory vector database
// In a real application, this would be Pinecone, Qdrant, or similar
const vectorStore = [];

/**
 * Process a document for embedding
 * @param {string} documentId - Document ID
 * @param {string} text - Document text
 * @returns {Promise<void>}
 */
exports.processDocument = async (documentId, text) => {
  // Split text into chunks
  const chunks = splitTextIntoChunks(text);
  
  // Generate embeddings for each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Generate embedding
    const embedding = await generateEmbedding(chunk.text);
    
    // Store in vector database
    vectorStore.push({
      id: `${documentId}_chunk_${i}`,
      documentId,
      content: chunk.text,
      page: chunk.page,
      embedding,
      createdAt: new Date().toISOString()
    });
  }
};

/**
 * Find relevant documents for a query
 * @param {string} query - Query text
 * @param {string} userId - User ID
 * @param {string} folderId - Folder ID (optional)
 * @param {Array} tags - Tags to filter by (optional)
 * @returns {Promise<Array>} - Relevant document chunks
 */
exports.findRelevantDocuments = async (query, userId, folderId, tags) => {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);
  
  // Get user's documents
  const userDocuments = await documentService.getAllDocuments(userId, folderId, tags);
  const userDocumentIds = userDocuments.map(doc => doc.id);
  
  // Filter vector store to only include user's documents
  const userVectors = vectorStore.filter(vector => 
    userDocumentIds.includes(vector.documentId)
  );
  
  // Calculate similarity scores
  const results = userVectors.map(vector => {
    const similarity = cosineSimilarity(queryEmbedding, vector.embedding);
    return {
      ...vector,
      similarity
    };
  });
  
  // Sort by similarity and take top 5
  const topResults = results
    .sort((a, b) => b.similarity - a.similarity)
    .filter(result => result.similarity > 0.25) // Threshold
    .slice(0, 5);
  
  // Enrich with document metadata
  const enrichedResults = await Promise.all(
    topResults.map(async result => {
      const document = userDocuments.find(doc => doc.id === result.documentId);
      return {
        ...result,
        documentName: document ? document.name : 'Unknown Document'
      };
    })
  );
  
  return enrichedResults;
};

/**
 * Delete document embeddings
 * @param {string} documentId - Document ID
 * @returns {Promise<void>}
 */
exports.deleteDocumentEmbeddings = async (documentId) => {
  // Remove all chunks for this document
  const initialLength = vectorStore.length;
  
  // Filter out chunks for this document
  const newVectorStore = vectorStore.filter(vector => vector.documentId !== documentId);
  
  // Replace the vector store
  vectorStore.length = 0;
  vectorStore.push(...newVectorStore);
  
  return initialLength - vectorStore.length;
};

// Helper functions

/**
 * Split text into chunks
 * @param {string} text - Text to split
 * @returns {Array} - Chunks
 */
function splitTextIntoChunks(text) {
  // Simple implementation - in a real app, this would be more sophisticated
  // with overlap, etc.
  const chunkSize = 800; // Roughly 800 tokens
  const overlap = 150; // 150 tokens overlap
  
  const chunks = [];
  let currentPage = 1;
  
  // Detect page breaks (simple heuristic)
  const pages = text.split(/\f|\n\s*\n\s*\n/);
  
  pages.forEach(pageText => {
    let startIndex = 0;
    
    while (startIndex < pageText.length) {
      const endIndex = Math.min(startIndex + chunkSize, pageText.length);
      
      chunks.push({
        text: pageText.substring(startIndex, endIndex),
        page: currentPage
      });
      
      startIndex += chunkSize - overlap;
      if (startIndex >= pageText.length) {
        currentPage++;
      }
    }
    
    currentPage++;
  });
  
  return chunks;
}

/**
 * Generate embedding for text
 * @param {string} text - Text to embed
 * @returns {Promise<Array>} - Embedding
 */
async function generateEmbedding(text) {
  try {
    // Call OpenAI's embedding API
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float"
    });
    
    // Return the embedding
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    
    // If there's an error with the OpenAI API, fall back to a random embedding
    // This is just for development purposes
    console.warn('Falling back to random embedding due to API error');
    
    // Simulate an embedding of dimension 1536 (same as OpenAI's text-embedding-3-small)
    const embedding = Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    
    // Normalize the embedding
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => val / norm);
    
    return normalizedEmbedding;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {number} - Similarity score
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimension');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}
