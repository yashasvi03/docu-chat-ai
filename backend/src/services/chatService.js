// In a real application, this would interact with a database
// For now, we'll use in-memory storage for demonstration

// In-memory storage
const conversations = [];
const messages = [];

// Auto-increment IDs
let conversationId = 1;
let messageId = 1;

/**
 * Get all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Conversations
 */
exports.getAllConversations = async (userId) => {
  return conversations.filter(conv => conv.userId === userId);
};

/**
 * Get conversation by ID
 * @param {string} id - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Conversation
 */
exports.getConversationById = async (id, userId) => {
  return conversations.find(conv => conv.id === id && conv.userId === userId);
};

/**
 * Create a conversation
 * @param {Object} conversationData - Conversation data
 * @returns {Promise<Object>} - Created conversation
 */
exports.createConversation = async (conversationData) => {
  const conversation = {
    id: (conversationId++).toString(),
    ...conversationData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  conversations.push(conversation);
  
  return conversation;
};

/**
 * Update a conversation
 * @param {string} id - Conversation ID
 * @param {string} userId - User ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Updated conversation
 */
exports.updateConversation = async (id, userId, updates) => {
  const index = conversations.findIndex(conv => conv.id === id && conv.userId === userId);
  
  if (index === -1) {
    return null;
  }
  
  const updatedConversation = {
    ...conversations[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  conversations[index] = updatedConversation;
  
  return updatedConversation;
};

/**
 * Delete a conversation
 * @param {string} id - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
exports.deleteConversation = async (id, userId) => {
  const index = conversations.findIndex(conv => conv.id === id && conv.userId === userId);
  
  if (index === -1) {
    return false;
  }
  
  conversations.splice(index, 1);
  
  // Also delete all messages in this conversation
  const messagesToDelete = messages.filter(msg => msg.conversationId === id);
  messagesToDelete.forEach(msg => {
    const msgIndex = messages.findIndex(m => m.id === msg.id);
    if (msgIndex !== -1) {
      messages.splice(msgIndex, 1);
    }
  });
  
  return true;
};

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Maximum number of messages to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Messages
 */
exports.getConversationMessages = async (conversationId, limit = 50, offset = 0) => {
  const conversationMessages = messages
    .filter(msg => msg.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  return conversationMessages.slice(offset, offset + limit);
};

/**
 * Save a message
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} - Saved message
 */
exports.saveMessage = async (messageData) => {
  const message = {
    id: (messageId++).toString(),
    ...messageData,
    createdAt: new Date().toISOString()
  };
  
  messages.push(message);
  
  // Update conversation's updatedAt
  const conversation = conversations.find(conv => conv.id === messageData.conversationId);
  if (conversation) {
    conversation.updatedAt = new Date().toISOString();
  }
  
  return message;
};

/**
 * Get message by ID
 * @param {string} id - Message ID
 * @returns {Promise<Object>} - Message
 */
exports.getMessageById = async (id) => {
  return messages.find(msg => msg.id === id);
};

/**
 * Delete a message
 * @param {string} id - Message ID
 * @returns {Promise<boolean>} - Success
 */
exports.deleteMessage = async (id) => {
  const index = messages.findIndex(msg => msg.id === id);
  
  if (index === -1) {
    return false;
  }
  
  messages.splice(index, 1);
  
  return true;
};
