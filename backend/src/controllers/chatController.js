const { OpenAI } = require('openai');

// Import services
const chatService = require('../services/chatService');
const documentService = require('../services/documentService');
const embeddingService = require('../services/embeddingService');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Send a query to the chat
 * @route POST /api/chat/query
 */
exports.sendQuery = async (req, res) => {
  try {
    const { message, folderId, tags, conversationId } = req.body;
    const userId = req.user.id;
    
    // Create a new conversation if not provided
    let conversation;
    if (conversationId) {
      conversation = await chatService.getConversationById(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({
          error: true,
          message: 'Conversation not found'
        });
      }
    } else {
      // Create a new conversation with the first few words of the message as the title
      const title = message.split(' ').slice(0, 5).join(' ') + '...';
      conversation = await chatService.createConversation({
        userId,
        title
      });
    }
    
    // Save user message to history
    const userMessage = await chatService.saveMessage({
      conversationId: conversation.id,
      content: message,
      role: 'user'
    });
    
    // Get relevant document chunks based on the query
    const relevantChunks = await embeddingService.findRelevantDocuments(
      message,
      userId,
      folderId,
      tags
    );
    
    // If no relevant chunks found, return a default response
    if (relevantChunks.length === 0) {
      const assistantMessage = await chatService.saveMessage({
        conversationId: conversation.id,
        content: "I don't have enough information to answer that question. My knowledge is limited to the documents you've uploaded.",
        role: 'assistant'
      });
      
      return res.status(200).json({
        success: true,
        data: {
          message: assistantMessage,
          conversation
        }
      });
    }
    
    // Prepare context from relevant chunks
    const context = relevantChunks.map(chunk => chunk.content).join('\n\n');
    
    // Get previous messages for context (limit to last 5 for simplicity)
    const previousMessages = await chatService.getConversationMessages(conversation.id, 5);
    
    // Prepare prompt for OpenAI
    const prompt = [
      {
        role: 'system',
        content: `You are DocuChat AI, a helpful assistant that answers questions based on the user's documents. 
        Answer ONLY based on the context provided. If the answer is not in the context, say "I don't have enough information to answer that question."
        Always cite your sources by referring to the document names and page numbers if available.`
      },
      {
        role: 'system',
        content: `Context from documents:\n${context}`
      },
      ...previousMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];
    
    // Call OpenAI API
    let aiResponse;
    try {
      console.log('Calling OpenAI API with prompt:', JSON.stringify(prompt, null, 2));
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: prompt,
        temperature: 0.3,
        max_tokens: 1000
      });
      
      aiResponse = completion.choices[0].message.content;
      console.log('OpenAI API response:', aiResponse);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      // Fallback response in case of API error
      aiResponse = "I'm having trouble processing your request due to an API error. Please try again later.";
      
      // If we have relevant chunks, at least provide some basic information
      if (relevantChunks.length > 0) {
        aiResponse += "\n\nHowever, I found some potentially relevant information in your documents:\n\n";
        relevantChunks.forEach((chunk, index) => {
          aiResponse += `${index + 1}. From "${chunk.documentName}": ${chunk.content.substring(0, 200)}...\n\n`;
        });
      }
    }
    
    // Extract citations from the response
    const citations = extractCitations(aiResponse, relevantChunks);
    
    // Save assistant message to history
    const assistantMessage = await chatService.saveMessage({
      conversationId: conversation.id,
      content: aiResponse,
      role: 'assistant',
      citations
    });
    
    res.status(200).json({
      success: true,
      data: {
        message: assistantMessage,
        conversation
      }
    });
  } catch (error) {
    console.error('Error sending query:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to process query'
    });
  }
};

/**
 * Get chat history
 * @route GET /api/chat/history
 */
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, limit = 50, offset = 0 } = req.query;
    
    if (!conversationId) {
      return res.status(400).json({
        error: true,
        message: 'Conversation ID is required'
      });
    }
    
    // Verify conversation belongs to user
    const conversation = await chatService.getConversationById(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({
        error: true,
        message: 'Conversation not found'
      });
    }
    
    const messages = await chatService.getConversationMessages(
      conversationId,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get chat history'
    });
  }
};

/**
 * Get all conversations
 * @route GET /api/chat/conversations
 */
exports.getAllConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await chatService.getAllConversations(userId);
    
    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get conversations'
    });
  }
};

/**
 * Get conversation by ID
 * @route GET /api/chat/conversations/:id
 */
exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const conversation = await chatService.getConversationById(id, userId);
    
    if (!conversation) {
      return res.status(404).json({
        error: true,
        message: 'Conversation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get conversation'
    });
  }
};

/**
 * Create a new conversation
 * @route POST /api/chat/conversations
 */
exports.createConversation = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;
    
    const conversation = await chatService.createConversation({
      userId,
      title
    });
    
    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create conversation'
    });
  }
};

/**
 * Delete a conversation
 * @route DELETE /api/chat/conversations/:id
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const conversation = await chatService.getConversationById(id, userId);
    
    if (!conversation) {
      return res.status(404).json({
        error: true,
        message: 'Conversation not found'
      });
    }
    
    await chatService.deleteConversation(id, userId);
    
    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete conversation'
    });
  }
};

/**
 * Update a conversation
 * @route PUT /api/chat/conversations/:id
 */
exports.updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;
    
    const conversation = await chatService.getConversationById(id, userId);
    
    if (!conversation) {
      return res.status(404).json({
        error: true,
        message: 'Conversation not found'
      });
    }
    
    const updatedConversation = await chatService.updateConversation(id, userId, { title });
    
    res.status(200).json({
      success: true,
      data: updatedConversation
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update conversation'
    });
  }
};

// Helper functions

/**
 * Extract citations from AI response and relevant chunks
 * @param {string} response - AI response
 * @param {Array} chunks - Relevant document chunks
 * @returns {Array} - Extracted citations
 */
const extractCitations = (response, chunks) => {
  // This is a simplified implementation
  // In a real application, you would use NLP or regex to extract citations
  
  // For now, just return the chunks as citations
  return chunks.map(chunk => ({
    documentId: chunk.documentId,
    documentName: chunk.documentName || 'Unknown Document',
    page: chunk.page,
    text: chunk.content.substring(0, 100) + '...' // Truncate for brevity
  }));
};
