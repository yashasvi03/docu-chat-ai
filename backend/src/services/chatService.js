/**
 * Chat Service
 * 
 * This service handles chat functionality including thread and message management,
 * as well as integration with the RAG system for document-based responses.
 */

const { openai, chatConfig, ragConfig } = require('../config/openai');
const { Thread, Message, User, Document } = require('../models');
const embeddingService = require('./embeddingService');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all threads for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Threads
 */
exports.getAllThreads = async (userId) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get threads
    const threads = await Thread.findAll({
      where: {
        userId,
        orgId: user.orgId
      },
      order: [['updatedAt', 'DESC']]
    });
    
    return threads;
  } catch (error) {
    console.error('Error getting threads:', error);
    throw error;
  }
};

/**
 * Get thread by ID
 * @param {string} id - Thread ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Thread
 */
exports.getThreadById = async (id, userId) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get thread
    const thread = await Thread.findOne({
      where: {
        id,
        userId,
        orgId: user.orgId
      }
    });
    
    return thread;
  } catch (error) {
    console.error('Error getting thread:', error);
    throw error;
  }
};

/**
 * Create a thread
 * @param {Object} threadData - Thread data
 * @returns {Promise<Object>} - Created thread
 */
exports.createThread = async (threadData) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(threadData.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create thread
    const thread = await Thread.create({
      id: uuidv4(),
      title: threadData.title || 'New Chat',
      userId: threadData.userId,
      orgId: user.orgId
    });
    
    return thread;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
};

/**
 * Update a thread
 * @param {string} id - Thread ID
 * @param {string} userId - User ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Updated thread
 */
exports.updateThread = async (id, userId, updates) => {
  try {
    // Get thread
    const thread = await Thread.findOne({
      where: {
        id,
        userId
      }
    });
    
    if (!thread) {
      return null;
    }
    
    // Update thread
    await thread.update({
      title: updates.title !== undefined ? updates.title : thread.title
    });
    
    return thread;
  } catch (error) {
    console.error('Error updating thread:', error);
    throw error;
  }
};

/**
 * Delete a thread
 * @param {string} id - Thread ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
exports.deleteThread = async (id, userId) => {
  try {
    // Get thread
    const thread = await Thread.findOne({
      where: {
        id,
        userId
      }
    });
    
    if (!thread) {
      return false;
    }
    
    // Delete thread (this will cascade delete messages)
    await thread.destroy();
    
    return true;
  } catch (error) {
    console.error('Error deleting thread:', error);
    throw error;
  }
};

/**
 * Get messages for a thread
 * @param {string} threadId - Thread ID
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of messages to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Messages
 */
exports.getThreadMessages = async (threadId, userId, limit = 50, offset = 0) => {
  try {
    // Get thread to verify ownership
    const thread = await Thread.findOne({
      where: {
        id: threadId,
        userId
      }
    });
    
    if (!thread) {
      throw new Error('Thread not found or access denied');
    }
    
    // Get messages
    const messages = await Message.findAll({
      where: {
        threadId
      },
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });
    
    return messages;
  } catch (error) {
    console.error('Error getting thread messages:', error);
    throw error;
  }
};

/**
 * Save a message
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} - Saved message
 */
exports.saveMessage = async (messageData) => {
  try {
    // Create message
    const message = await Message.create({
      id: uuidv4(),
      content: messageData.content,
      role: messageData.role,
      threadId: messageData.threadId,
      citations: messageData.citations || null
    });
    
    // Update thread's updatedAt
    await Thread.update(
      { updatedAt: new Date() },
      { where: { id: messageData.threadId } }
    );
    
    return message;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

/**
 * Get message by ID
 * @param {string} id - Message ID
 * @returns {Promise<Object>} - Message
 */
exports.getMessageById = async (id) => {
  try {
    return await Message.findByPk(id);
  } catch (error) {
    console.error('Error getting message:', error);
    throw error;
  }
};

/**
 * Delete a message
 * @param {string} id - Message ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
exports.deleteMessage = async (id, userId) => {
  try {
    // Get message
    const message = await Message.findByPk(id, {
      include: [
        {
          model: Thread,
          where: { userId }
        }
      ]
    });
    
    if (!message) {
      return false;
    }
    
    // Delete message
    await message.destroy();
    
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Process a user message and generate a response
 * @param {string} threadId - Thread ID
 * @param {string} userId - User ID
 * @param {string} userMessage - User message
 * @param {Object} options - Options for processing
 * @returns {Promise<Object>} - Response message
 */
exports.processMessage = async (threadId, userId, userMessage, options = {}) => {
  try {
    const {
      folderId = null,
      tags = [],
      stream = false,
      onToken = null
    } = options;
    
    // Get thread to verify ownership
    const thread = await Thread.findOne({
      where: {
        id: threadId,
        userId
      }
    });
    
    if (!thread) {
      throw new Error('Thread not found or access denied');
    }
    
    // Save user message
    const savedUserMessage = await this.saveMessage({
      content: userMessage,
      role: 'user',
      threadId
    });
    
    // Get thread history (last 10 messages)
    const history = await Message.findAll({
      where: {
        threadId
      },
      order: [['createdAt', 'ASC']],
      limit: 10
    });
    
    // Format history for the LLM
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Find relevant documents
    const relevantDocuments = await embeddingService.findRelevantDocuments(userMessage, userId, {
      folderId,
      tags,
      limit: ragConfig.maxChunks,
      threshold: ragConfig.similarityThreshold
    });
    
    // Generate prompt with retrieved chunks
    const promptMessages = embeddingService.generatePrompt(userMessage, relevantDocuments);
    
    // Combine history with prompt
    // We take the system message from the prompt and add the history before the user's question
    const messages = [
      promptMessages[0], // System message
      ...formattedHistory.slice(0, -1), // Previous messages (excluding the last user message)
      promptMessages[1] // User message with context
    ];
    
    // Call OpenAI API
    let response;
    let citations = [];
    
    if (stream) {
      // Streaming response
      response = await streamResponse(messages, onToken);
    } else {
      // Non-streaming response
      response = await openai.chat.completions.create({
        model: chatConfig.model,
        messages,
        temperature: chatConfig.temperature,
        max_tokens: chatConfig.max_tokens,
        top_p: chatConfig.top_p,
        frequency_penalty: chatConfig.frequency_penalty,
        presence_penalty: chatConfig.presence_penalty,
        logit_bias: chatConfig.logit_bias
      });
    }
    
    // Extract citations from response
    const responseText = stream ? response : response.choices[0].message.content;
    citations = extractCitations(responseText, relevantDocuments);
    
    // Save assistant message
    const savedAssistantMessage = await this.saveMessage({
      content: responseText,
      role: 'assistant',
      threadId,
      citations
    });
    
    return {
      message: savedAssistantMessage,
      citations
    };
  } catch (error) {
    console.error('Error processing message:', error);
    
    // Save error message
    await this.saveMessage({
      content: 'I encountered an error while processing your request. Please try again.',
      role: 'assistant',
      threadId
    });
    
    throw error;
  }
};

/**
 * Stream response from OpenAI
 * @param {Array} messages - Messages to send to OpenAI
 * @param {Function} onToken - Callback for each token
 * @returns {Promise<string>} - Complete response
 */
async function streamResponse(messages, onToken) {
  try {
    const stream = await openai.chat.completions.create({
      model: chatConfig.model,
      messages,
      temperature: chatConfig.temperature,
      max_tokens: chatConfig.max_tokens,
      top_p: chatConfig.top_p,
      frequency_penalty: chatConfig.frequency_penalty,
      presence_penalty: chatConfig.presence_penalty,
      logit_bias: chatConfig.logit_bias,
      stream: true
    });
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        if (onToken) {
          onToken(content);
        }
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error('Error streaming response:', error);
    throw error;
  }
}

/**
 * Extract citations from response
 * @param {string} response - Response text
 * @param {Array} relevantDocuments - Relevant documents
 * @returns {Array} - Citations
 */
function extractCitations(response, relevantDocuments) {
  const citations = [];
  const citationRegex = /\[Document (\d+):/g;
  
  let match;
  while ((match = citationRegex.exec(response)) !== null) {
    const documentIndex = parseInt(match[1]) - 1;
    if (documentIndex >= 0 && documentIndex < relevantDocuments.length) {
      const document = relevantDocuments[documentIndex];
      
      // Check if this document is already cited
      const existingCitation = citations.find(c => c.chunkId === document.id);
      
      if (!existingCitation) {
        citations.push({
          chunkId: document.id,
          documentId: document.documentId,
          documentTitle: document.documentTitle || 'Untitled',
          page: document.page || 1,
          similarity: document.similarity
        });
      }
    }
  }
  
  return citations;
}
