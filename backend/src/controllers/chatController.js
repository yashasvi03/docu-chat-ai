/**
 * Chat Controller
 * 
 * This controller handles chat functionality including thread and message management,
 * as well as integration with the RAG system for document-based responses.
 */

// Import services
const chatService = require('../services/chatService');
const embeddingService = require('../services/embeddingService');

/**
 * Send a message to the chat
 * @route POST /api/chat/message
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, threadId, folderId, tags, stream } = req.body;
    const userId = req.user.id;
    
    // Create a new thread if not provided
    let thread;
    if (threadId) {
      thread = await chatService.getThreadById(threadId, userId);
      if (!thread) {
        return res.status(404).json({
          error: true,
          message: 'Thread not found'
        });
      }
    } else {
      // Create a new thread with the first few words of the message as the title
      const title = message.split(' ').slice(0, 5).join(' ') + '...';
      thread = await chatService.createThread({
        userId,
        title
      });
    }
    
    // If streaming is requested, set up SSE
    if (stream) {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Send thread info
      res.write(`data: ${JSON.stringify({ type: 'thread', data: thread })}\n\n`);
      
      // Process message with streaming
      try {
        const onToken = (token) => {
          res.write(`data: ${JSON.stringify({ type: 'token', data: token })}\n\n`);
        };
        
        const result = await chatService.processMessage(thread.id, userId, message, {
          folderId,
          tags,
          stream: true,
          onToken
        });
        
        // Send citations
        res.write(`data: ${JSON.stringify({ type: 'citations', data: result.citations })}\n\n`);
        
        // Send completion event
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        
        res.end();
      } catch (error) {
        // Send error event
        res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
        res.end();
      }
    } else {
      // Process message without streaming
      const result = await chatService.processMessage(thread.id, userId, message, {
        folderId,
        tags
      });
      
      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          thread,
          citations: result.citations
        }
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to process message'
    });
  }
};

/**
 * Get chat history
 * @route GET /api/chat/messages
 */
exports.getChatMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threadId, limit = 50, offset = 0 } = req.query;
    
    if (!threadId) {
      return res.status(400).json({
        error: true,
        message: 'Thread ID is required'
      });
    }
    
    // Verify thread belongs to user
    const thread = await chatService.getThreadById(threadId, userId);
    if (!thread) {
      return res.status(404).json({
        error: true,
        message: 'Thread not found'
      });
    }
    
    const messages = await chatService.getThreadMessages(
      threadId,
      userId,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get chat messages'
    });
  }
};

/**
 * Get all threads
 * @route GET /api/chat/threads
 */
exports.getAllThreads = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const threads = await chatService.getAllThreads(userId);
    
    res.status(200).json({
      success: true,
      data: threads
    });
  } catch (error) {
    console.error('Error getting threads:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get threads'
    });
  }
};

/**
 * Get thread by ID
 * @route GET /api/chat/threads/:id
 */
exports.getThreadById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const thread = await chatService.getThreadById(id, userId);
    
    if (!thread) {
      return res.status(404).json({
        error: true,
        message: 'Thread not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: thread
    });
  } catch (error) {
    console.error('Error getting thread:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get thread'
    });
  }
};

/**
 * Create a new thread
 * @route POST /api/chat/threads
 */
exports.createThread = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;
    
    const thread = await chatService.createThread({
      userId,
      title: title || 'New Chat'
    });
    
    res.status(201).json({
      success: true,
      data: thread
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create thread'
    });
  }
};

/**
 * Delete a thread
 * @route DELETE /api/chat/threads/:id
 */
exports.deleteThread = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const thread = await chatService.getThreadById(id, userId);
    
    if (!thread) {
      return res.status(404).json({
        error: true,
        message: 'Thread not found'
      });
    }
    
    await chatService.deleteThread(id, userId);
    
    res.status(200).json({
      success: true,
      message: 'Thread deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete thread'
    });
  }
};

/**
 * Update a thread
 * @route PUT /api/chat/threads/:id
 */
exports.updateThread = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;
    
    const thread = await chatService.getThreadById(id, userId);
    
    if (!thread) {
      return res.status(404).json({
        error: true,
        message: 'Thread not found'
      });
    }
    
    const updatedThread = await chatService.updateThread(id, userId, { title });
    
    res.status(200).json({
      success: true,
      data: updatedThread
    });
  } catch (error) {
    console.error('Error updating thread:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update thread'
    });
  }
};

/**
 * Get citation content
 * @route GET /api/chat/citations/:id
 */
exports.getCitationContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get the chunk
    const chunk = await embeddingService.getChunkById(id, userId);
    
    if (!chunk) {
      return res.status(404).json({
        error: true,
        message: 'Citation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: chunk
    });
  } catch (error) {
    console.error('Error getting citation content:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get citation content'
    });
  }
};
