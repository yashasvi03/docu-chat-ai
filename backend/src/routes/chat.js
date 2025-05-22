const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import controllers
const chatController = require('../controllers/chatController');

// Import middleware
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

// Routes
// POST /api/chat/query - Send a query to the chat
router.post('/query', 
  auth, 
  body('message').isString().notEmpty(),
  body('folderId').optional().isString(),
  body('tags').optional().isArray(),
  validate,
  chatController.sendQuery
);

// GET /api/chat/history - Get chat history
router.get('/history', auth, chatController.getChatHistory);

// GET /api/chat/conversations - Get all conversations
router.get('/conversations', auth, chatController.getAllConversations);

// GET /api/chat/conversations/:id - Get a specific conversation
router.get('/conversations/:id', 
  auth, 
  param('id').isString(),
  validate,
  chatController.getConversationById
);

// POST /api/chat/conversations - Create a new conversation
router.post('/conversations', 
  auth, 
  body('title').isString(),
  validate,
  chatController.createConversation
);

// DELETE /api/chat/conversations/:id - Delete a conversation
router.delete('/conversations/:id', 
  auth, 
  param('id').isString(),
  validate,
  chatController.deleteConversation
);

// PUT /api/chat/conversations/:id - Update a conversation
router.put('/conversations/:id', 
  auth, 
  param('id').isString(),
  body('title').optional().isString(),
  validate,
  chatController.updateConversation
);

module.exports = router;
