const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import controllers
const chatController = require('../controllers/chatController');

// Import middleware
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Thread routes
// GET /api/chat/threads - Get all threads
router.get('/threads', auth, chatController.getAllThreads);

// GET /api/chat/threads/:id - Get thread by ID
router.get('/threads/:id', 
  auth, 
  param('id').isString(),
  validate,
  chatController.getThreadById
);

// POST /api/chat/threads - Create a new thread
router.post('/threads', 
  auth, 
  body('title').optional().isString(),
  validate,
  chatController.createThread
);

// PUT /api/chat/threads/:id - Update a thread
router.put('/threads/:id', 
  auth, 
  param('id').isString(),
  body('title').isString(),
  validate,
  chatController.updateThread
);

// DELETE /api/chat/threads/:id - Delete a thread
router.delete('/threads/:id', 
  auth, 
  param('id').isString(),
  validate,
  chatController.deleteThread
);

// Message routes
// POST /api/chat/message - Send a message
router.post('/message', 
  auth, 
  body('message').isString().notEmpty(),
  body('threadId').optional().isString(),
  body('folderId').optional().isString(),
  body('tags').optional().isArray(),
  body('stream').optional().isBoolean(),
  validate,
  chatController.sendMessage
);

// GET /api/chat/messages - Get messages for a thread
router.get('/messages', 
  auth, 
  query('threadId').isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate,
  chatController.getChatMessages
);

// Citation routes
// GET /api/chat/citations/:id - Get citation content
router.get('/citations/:id', 
  auth, 
  param('id').isString(),
  validate,
  chatController.getCitationContent
);

module.exports = router;
