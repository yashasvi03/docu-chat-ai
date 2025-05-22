// In a real application, this would interact with a database
// For now, we'll use in-memory storage for demonstration

// In-memory storage
const users = [];
const refreshTokens = {};
const resetTokens = {};

// Auto-increment ID
let userId = 1;

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} - User
 */
exports.getUserById = async (id) => {
  return users.find(user => user.id === id);
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} - User
 */
exports.getUserByEmail = async (email) => {
  return users.find(user => user.email === email);
};

/**
 * Create a user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} - Created user
 */
exports.createUser = async (userData) => {
  const user = {
    id: (userId++).toString(),
    ...userData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users.push(user);
  
  return user;
};

/**
 * Update a user
 * @param {string} id - User ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Updated user
 */
exports.updateUser = async (id, updates) => {
  const index = users.findIndex(user => user.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedUser = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  users[index] = updatedUser;
  
  return updatedUser;
};

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise<boolean>} - Success
 */
exports.deleteUser = async (id) => {
  const index = users.findIndex(user => user.id === id);
  
  if (index === -1) {
    return false;
  }
  
  users.splice(index, 1);
  
  // Clean up refresh tokens
  if (refreshTokens[id]) {
    delete refreshTokens[id];
  }
  
  // Clean up reset tokens
  if (resetTokens[id]) {
    delete resetTokens[id];
  }
  
  return true;
};

/**
 * Save refresh token for a user
 * @param {string} userId - User ID
 * @param {string} token - Refresh token
 * @returns {Promise<void>}
 */
exports.saveRefreshToken = async (userId, token) => {
  refreshTokens[userId] = token;
};

/**
 * Clear refresh token for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
exports.clearRefreshToken = async (userId) => {
  if (refreshTokens[userId]) {
    delete refreshTokens[userId];
  }
};

/**
 * Get user by refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<Object>} - User
 */
exports.getUserByRefreshToken = async (token) => {
  const userId = Object.keys(refreshTokens).find(id => refreshTokens[id] === token);
  
  if (!userId) {
    return null;
  }
  
  return exports.getUserById(userId);
};

/**
 * Save reset token for a user
 * @param {string} userId - User ID
 * @param {string} token - Reset token
 * @param {number} expiry - Token expiry timestamp
 * @returns {Promise<void>}
 */
exports.saveResetToken = async (userId, token, expiry) => {
  resetTokens[userId] = {
    token,
    expiry
  };
};

/**
 * Get user by reset token
 * @param {string} token - Reset token
 * @returns {Promise<Object>} - User with reset token expiry
 */
exports.getUserByResetToken = async (token) => {
  const userId = Object.keys(resetTokens).find(id => resetTokens[id].token === token);
  
  if (!userId) {
    return null;
  }
  
  const user = await exports.getUserById(userId);
  
  if (!user) {
    return null;
  }
  
  return {
    ...user,
    resetTokenExpiry: resetTokens[userId].expiry
  };
};
