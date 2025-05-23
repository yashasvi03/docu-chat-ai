/**
 * Embedding Service
 * 
 * This service handles document embedding generation and vector search.
 * It uses OpenAI's text-embedding-3-small model for generating embeddings
 * and PostgreSQL with pgvector for vector storage and search.
 */

const { openai, embeddingConfig, ragConfig } = require('../config/openai');
const { Chunk, Document, User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { encode } = require('gpt-tokenizer');
const { Op } = require('sequelize');

/**
 * Process a document for embedding
 * @param {string} documentId - Document ID
 * @param {string} text - Document text
 * @returns {Promise<void>}
 */
exports.processDocument = async (documentId, text) => {
  try {
    // Get the document
    const document = await Document.findByPk(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }
    
    // Update document status to processing
    await document.update({ status: 'processing' });
    
    // Split text into chunks
    const chunks = splitTextIntoChunks(text, ragConfig.chunkSize, ragConfig.chunkOverlap);
    
    // Generate embeddings for each chunk
    const chunkPromises = chunks.map(async (chunk, index) => {
      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk.text);
        
        // Store in database
        await Chunk.create({
          id: uuidv4(),
          documentId,
          content: chunk.text,
          page: chunk.page,
          tokenCount: chunk.tokenCount,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
          embedding,
          metadata: {
            documentTitle: document.title,
            mimeType: document.mime
          }
        });
      } catch (error) {
        console.error(`Error processing chunk ${index} for document ${documentId}:`, error);
        throw error;
      }
    });
    
    // Wait for all chunks to be processed
    await Promise.all(chunkPromises);
    
    // Update document status to ready
    await document.update({ status: 'ready' });
    
    console.log(`Document ${documentId} processed successfully with ${chunks.length} chunks`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    
    // Update document status to error
    try {
      const document = await Document.findByPk(documentId);
      if (document) {
        await document.update({ status: 'error' });
      }
    } catch (updateError) {
      console.error(`Error updating document status for ${documentId}:`, updateError);
    }
    
    throw error;
  }
};

/**
 * Find relevant documents for a query
 * @param {string} query - Query text
 * @param {string} userId - User ID
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Relevant document chunks
 */
exports.findRelevantDocuments = async (query, userId, options = {}) => {
  try {
    const {
      folderId = null,
      tags = [],
      limit = ragConfig.maxChunks,
      threshold = ragConfig.similarityThreshold
    } = options;
    
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Build search options
    const searchOptions = {
      limit,
      threshold,
      orgId: user.orgId
    };
    
    // If folderId is provided, get all documents in that folder
    let documentIds = null;
    if (folderId) {
      const documents = await Document.findAll({
        where: {
          folderId,
          orgId: user.orgId
        },
        attributes: ['id']
      });
      
      documentIds = documents.map(doc => doc.id);
      
      // If no documents found in the folder, return empty array
      if (documentIds.length === 0) {
        return [];
      }
      
      searchOptions.documentIds = documentIds;
    }
    
    // If tags are provided, filter by tags
    if (tags && tags.length > 0) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      
      const documents = await Document.findAll({
        where: {
          orgId: user.orgId,
          ...(folderId ? { folderId } : {}),
          tags: { [Op.overlap]: tagArray }
        },
        attributes: ['id']
      });
      
      const taggedDocumentIds = documents.map(doc => doc.id);
      
      // If no documents found with the tags, return empty array
      if (taggedDocumentIds.length === 0) {
        return [];
      }
      
      // If documentIds already filtered by folder, intersect with tagged documents
      if (documentIds) {
        documentIds = documentIds.filter(id => taggedDocumentIds.includes(id));
        
        // If no documents match both folder and tags, return empty array
        if (documentIds.length === 0) {
          return [];
        }
        
        searchOptions.documentIds = documentIds;
      } else {
        searchOptions.documentIds = taggedDocumentIds;
      }
    }
    
    // Find similar chunks
    const results = await Chunk.findSimilar(queryEmbedding, searchOptions);
    
    return results;
  } catch (error) {
    console.error('Error finding relevant documents:', error);
    throw error;
  }
};

/**
 * Delete document embeddings
 * @param {string} documentId - Document ID
 * @returns {Promise<number>} - Number of deleted chunks
 */
exports.deleteDocumentEmbeddings = async (documentId) => {
  try {
    // Delete all chunks for this document
    const result = await Chunk.destroy({
      where: {
        documentId
      }
    });
    
    return result;
  } catch (error) {
    console.error(`Error deleting embeddings for document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Get chunk by ID
 * @param {string} id - Chunk ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Chunk
 */
exports.getChunkById = async (id, userId) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get chunk with document info
    const chunk = await Chunk.findOne({
      where: {
        id
      },
      include: [
        {
          model: Document,
          where: {
            orgId: user.orgId
          },
          attributes: ['id', 'title', 'mime']
        }
      ]
    });
    
    return chunk;
  } catch (error) {
    console.error(`Error getting chunk ${id}:`, error);
    throw error;
  }
};

/**
 * Generate a prompt for the LLM with retrieved chunks
 * @param {string} query - User query
 * @param {Array} chunks - Retrieved chunks
 * @returns {Object} - Prompt messages
 */
exports.generatePrompt = (query, chunks) => {
  // If no chunks found, return a prompt to say we don't have enough information
  if (!chunks || chunks.length === 0) {
    return [
      {
        role: 'system',
        content: ragConfig.systemPrompt
      },
      {
        role: 'user',
        content: `Question: ${query}\n\nDocument excerpts: [No relevant documents found]`
      }
    ];
  }
  
  // Format chunks with metadata
  const formattedChunks = chunks.map((chunk, index) => {
    return `[Document ${index + 1}: ${chunk.documentTitle || 'Untitled'}, Page ${chunk.page || 'N/A'}]\n${chunk.content}\n`;
  }).join('\n');
  
  // Create the prompt
  return [
    {
      role: 'system',
      content: ragConfig.systemPrompt
    },
    {
      role: 'user',
      content: `Question: ${query}\n\nDocument excerpts:\n${formattedChunks}`
    }
  ];
};

// Helper functions

/**
 * Split text into chunks
 * @param {string} text - Text to split
 * @param {number} targetChunkSize - Target token count per chunk
 * @param {number} overlap - Overlap between chunks as a percentage (0-1)
 * @returns {Array} - Chunks
 */
function splitTextIntoChunks(text, targetChunkSize = 800, overlap = 0.2) {
  // Calculate overlap in tokens
  const overlapTokens = Math.floor(targetChunkSize * overlap);
  
  const chunks = [];
  let currentPage = 1;
  
  // Detect page breaks (simple heuristic)
  const pages = text.split(/\f|\n\s*\n\s*\n/);
  
  pages.forEach((pageText, pageIndex) => {
    // Skip empty pages
    if (!pageText.trim()) {
      return;
    }
    
    // Tokenize the page text
    const tokens = encode(pageText);
    
    let startTokenIndex = 0;
    
    while (startTokenIndex < tokens.length) {
      // Calculate end token index
      const endTokenIndex = Math.min(startTokenIndex + targetChunkSize, tokens.length);
      
      // Get the chunk tokens
      const chunkTokens = tokens.slice(startTokenIndex, endTokenIndex);
      
      // Convert back to text
      const chunkText = decode(chunkTokens);
      
      // Add chunk
      chunks.push({
        text: chunkText,
        page: pageIndex + 1,
        tokenCount: chunkTokens.length,
        startIndex: startTokenIndex,
        endIndex: endTokenIndex - 1
      });
      
      // Move to next chunk with overlap
      startTokenIndex += targetChunkSize - overlapTokens;
      
      // If we've reached the end of the page, break
      if (startTokenIndex >= tokens.length) {
        break;
      }
    }
  });
  
  return chunks;
}

/**
 * Decode tokens back to text
 * This is a simple implementation and might not be perfect
 * @param {Array} tokens - Array of tokens
 * @returns {string} - Decoded text
 */
function decode(tokens) {
  // This is a placeholder. In a real implementation, you would use the tokenizer's decode function
  // For now, we'll just join the tokens with spaces
  return tokens.join(' ').replace(/ ([.,;:!?])/g, '$1');
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
      model: embeddingConfig.model,
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
    const embedding = Array(embeddingConfig.dimensions).fill(0).map(() => Math.random() * 2 - 1);
    
    // Normalize the embedding
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => val / norm);
    
    return normalizedEmbedding;
  }
}
