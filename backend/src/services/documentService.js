// In a real application, this would interact with a database
// For now, we'll use in-memory storage for demonstration

// In-memory storage
const documents = [];
const folders = [];

// Auto-increment IDs
let documentId = 1;
let folderId = 1;

/**
 * Get all documents for a user
 * @param {string} userId - User ID
 * @param {string} folderId - Folder ID (optional)
 * @param {Array} tags - Tags to filter by (optional)
 * @returns {Promise<Array>} - Documents
 */
exports.getAllDocuments = async (userId, folderId, tags) => {
  let result = documents.filter(doc => doc.userId === userId);
  
  // Filter by folder
  if (folderId) {
    result = result.filter(doc => doc.folderId === folderId);
  }
  
  // Filter by tags
  if (tags && tags.length > 0) {
    result = result.filter(doc => {
      return tags.every(tag => doc.tags.includes(tag));
    });
  }
  
  return result;
};

/**
 * Get document by ID
 * @param {string} id - Document ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Document
 */
exports.getDocumentById = async (id, userId) => {
  return documents.find(doc => doc.id === id && doc.userId === userId);
};

/**
 * Create a document
 * @param {Object} documentData - Document data
 * @returns {Promise<Object>} - Created document
 */
exports.createDocument = async (documentData) => {
  const document = {
    id: (documentId++).toString(),
    ...documentData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  documents.push(document);
  
  return document;
};

/**
 * Update a document
 * @param {string} id - Document ID
 * @param {string} userId - User ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Updated document
 */
exports.updateDocument = async (id, userId, updates) => {
  const index = documents.findIndex(doc => doc.id === id && doc.userId === userId);
  
  if (index === -1) {
    return null;
  }
  
  const updatedDocument = {
    ...documents[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  documents[index] = updatedDocument;
  
  return updatedDocument;
};

/**
 * Delete a document
 * @param {string} id - Document ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
exports.deleteDocument = async (id, userId) => {
  const index = documents.findIndex(doc => doc.id === id && doc.userId === userId);
  
  if (index === -1) {
    return false;
  }
  
  documents.splice(index, 1);
  
  return true;
};

/**
 * Get all folders for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Folders
 */
exports.getAllFolders = async (userId) => {
  return folders.filter(folder => folder.userId === userId);
};

/**
 * Create a folder
 * @param {Object} folderData - Folder data
 * @returns {Promise<Object>} - Created folder
 */
exports.createFolder = async (folderData) => {
  const folder = {
    id: (folderId++).toString(),
    ...folderData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  folders.push(folder);
  
  return folder;
};

/**
 * Update a folder
 * @param {string} id - Folder ID
 * @param {string} userId - User ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Updated folder
 */
exports.updateFolder = async (id, userId, updates) => {
  const index = folders.findIndex(folder => folder.id === id && folder.userId === userId);
  
  if (index === -1) {
    return null;
  }
  
  const updatedFolder = {
    ...folders[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  folders[index] = updatedFolder;
  
  return updatedFolder;
};

/**
 * Delete a folder
 * @param {string} id - Folder ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
exports.deleteFolder = async (id, userId) => {
  const index = folders.findIndex(folder => folder.id === id && folder.userId === userId);
  
  if (index === -1) {
    return false;
  }
  
  folders.splice(index, 1);
  
  // Also update any documents that were in this folder
  documents.forEach(doc => {
    if (doc.folderId === id) {
      doc.folderId = null;
    }
  });
  
  return true;
};

/**
 * Get folder by ID
 * @param {string} id - Folder ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Folder
 */
exports.getFolderById = async (id, userId) => {
  return folders.find(folder => folder.id === id && folder.userId === userId);
};
