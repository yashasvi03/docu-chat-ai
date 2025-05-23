/**
 * Document Service
 * 
 * This service handles document and folder operations using Sequelize models.
 */

const { Op } = require('sequelize');
const { Document, Folder, Chunk, User, Organisation } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all documents for a user
 * @param {string} userId - User ID
 * @param {string} folderId - Folder ID (optional)
 * @param {Array} tags - Tags to filter by (optional)
 * @returns {Promise<Array>} - Documents
 */
exports.getAllDocuments = async (userId, folderId, tags) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Build query conditions
    const where = {
      orgId: user.orgId
    };

    // Filter by folder if provided
    if (folderId) {
      where.folderId = folderId;
    }

    // Get documents
    const documents = await Document.findAll({
      where,
      include: [
        {
          model: Folder,
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Filter by tags if provided
    let filteredDocuments = documents;
    if (tags && tags.length > 0) {
      // Convert tags to array if it's a string
      const tagArray = Array.isArray(tags) ? tags : [tags];
      
      // Filter documents that have all the specified tags
      filteredDocuments = documents.filter(doc => {
        const docTags = doc.tags || [];
        return tagArray.every(tag => docTags.includes(tag));
      });
    }

    return filteredDocuments;
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};

/**
 * Get document by ID
 * @param {string} id - Document ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Document
 */
exports.getDocumentById = async (id, userId) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get document
    const document = await Document.findOne({
      where: {
        id,
        orgId: user.orgId
      },
      include: [
        {
          model: Folder,
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Chunk,
          attributes: ['id', 'page', 'tokenCount']
        }
      ]
    });

    return document;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

/**
 * Create a document
 * @param {Object} documentData - Document data
 * @returns {Promise<Object>} - Created document
 */
exports.createDocument = async (documentData) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(documentData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create document
    const document = await Document.create({
      id: uuidv4(),
      title: documentData.name,
      mime: documentData.type,
      size: documentData.size,
      storagePath: documentData.url,
      folderId: documentData.folderId,
      tags: documentData.tags || [],
      orgId: user.orgId,
      uploadedById: documentData.userId
    });

    return document;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Update a document
 * @param {string} id - Document ID
 * @param {string} userId - User ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Updated document
 */
exports.updateDocument = async (id, userId, updates) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get document
    const document = await Document.findOne({
      where: {
        id,
        orgId: user.orgId
      }
    });

    if (!document) {
      return null;
    }

    // Update document
    await document.update({
      title: updates.name !== undefined ? updates.name : document.title,
      folderId: updates.folderId !== undefined ? updates.folderId : document.folderId,
      tags: updates.tags !== undefined ? updates.tags : document.tags
    });

    // Reload document with associations
    await document.reload({
      include: [
        {
          model: Folder,
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return document;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Delete a document
 * @param {string} id - Document ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success
 */
exports.deleteDocument = async (id, userId) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get document
    const document = await Document.findOne({
      where: {
        id,
        orgId: user.orgId
      }
    });

    if (!document) {
      return false;
    }

    // Delete document
    await document.destroy();

    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Get all folders for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Folders
 */
exports.getAllFolders = async (userId) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get folders
    const folders = await Folder.findAll({
      where: {
        orgId: user.orgId
      },
      include: [
        {
          model: Folder,
          as: 'parent',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    return folders;
  } catch (error) {
    console.error('Error getting folders:', error);
    throw error;
  }
};

/**
 * Create a folder
 * @param {Object} folderData - Folder data
 * @returns {Promise<Object>} - Created folder
 */
exports.createFolder = async (folderData) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(folderData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if parent folder exists and belongs to the same organization
    if (folderData.parentId) {
      const parentFolder = await Folder.findOne({
        where: {
          id: folderData.parentId,
          orgId: user.orgId
        }
      });

      if (!parentFolder) {
        throw new Error('Parent folder not found');
      }
    }

    // Check if folder with same name already exists in the same parent
    const existingFolder = await Folder.findOne({
      where: {
        name: folderData.name,
        parentId: folderData.parentId,
        orgId: user.orgId
      }
    });

    if (existingFolder) {
      throw new Error('Folder with this name already exists in this location');
    }

    // Create folder
    const folder = await Folder.create({
      id: uuidv4(),
      name: folderData.name,
      parentId: folderData.parentId,
      orgId: user.orgId
    });

    return folder;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

/**
 * Update a folder
 * @param {string} id - Folder ID
 * @param {string} userId - User ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} - Updated folder
 */
exports.updateFolder = async (id, userId, updates) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get folder
    const folder = await Folder.findOne({
      where: {
        id,
        orgId: user.orgId
      }
    });

    if (!folder) {
      return null;
    }

    // Check if new parent folder exists and belongs to the same organization
    if (updates.parentId && updates.parentId !== folder.parentId) {
      const parentFolder = await Folder.findOne({
        where: {
          id: updates.parentId,
          orgId: user.orgId
        }
      });

      if (!parentFolder) {
        throw new Error('Parent folder not found');
      }

      // Prevent circular references
      if (updates.parentId === id) {
        throw new Error('A folder cannot be its own parent');
      }

      // Check if the new parent is a descendant of this folder
      const isDescendant = await isDescendantFolder(updates.parentId, id);
      if (isDescendant) {
        throw new Error('Cannot move a folder to its own descendant');
      }
    }

    // Check if folder with same name already exists in the new parent
    if (updates.name || updates.parentId) {
      const existingFolder = await Folder.findOne({
        where: {
          name: updates.name || folder.name,
          parentId: updates.parentId !== undefined ? updates.parentId : folder.parentId,
          orgId: user.orgId,
          id: { [Op.ne]: id } // Not this folder
        }
      });

      if (existingFolder) {
        throw new Error('Folder with this name already exists in this location');
      }
    }

    // Update folder
    await folder.update({
      name: updates.name !== undefined ? updates.name : folder.name,
      parentId: updates.parentId !== undefined ? updates.parentId : folder.parentId
    });

    // Reload folder with associations
    await folder.reload({
      include: [
        {
          model: Folder,
          as: 'parent',
          attributes: ['id', 'name']
        }
      ]
    });

    return folder;
  } catch (error) {
    console.error('Error updating folder:', error);
    throw error;
  }
};

/**
 * Delete a folder
 * @param {string} id - Folder ID
 * @param {string} userId - User ID
 * @param {boolean} recursive - Whether to delete subfolders and documents
 * @returns {Promise<boolean>} - Success
 */
exports.deleteFolder = async (id, userId, recursive = false) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get folder
    const folder = await Folder.findOne({
      where: {
        id,
        orgId: user.orgId
      }
    });

    if (!folder) {
      return false;
    }

    // Check if folder has subfolders or documents
    const subfolders = await Folder.findAll({
      where: {
        parentId: id
      }
    });

    const documents = await Document.findAll({
      where: {
        folderId: id
      }
    });

    if ((subfolders.length > 0 || documents.length > 0) && !recursive) {
      throw new Error('Folder is not empty. Use recursive delete to delete all contents.');
    }

    // If recursive, delete all subfolders and documents
    if (recursive) {
      // Delete subfolders recursively
      for (const subfolder of subfolders) {
        await exports.deleteFolder(subfolder.id, userId, true);
      }

      // Delete documents
      for (const document of documents) {
        await Document.destroy({
          where: {
            id: document.id
          }
        });
      }
    }

    // Delete folder
    await folder.destroy();

    return true;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

/**
 * Get folder by ID
 * @param {string} id - Folder ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Folder
 */
exports.getFolderById = async (id, userId) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get folder
    const folder = await Folder.findOne({
      where: {
        id,
        orgId: user.orgId
      },
      include: [
        {
          model: Folder,
          as: 'parent',
          attributes: ['id', 'name']
        },
        {
          model: Folder,
          as: 'subfolders',
          attributes: ['id', 'name']
        }
      ]
    });

    return folder;
  } catch (error) {
    console.error('Error getting folder:', error);
    throw error;
  }
};

/**
 * Get folder tree
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Folder tree
 */
exports.getFolderTree = async (userId) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all folders
    const folders = await Folder.findAll({
      where: {
        orgId: user.orgId
      },
      attributes: ['id', 'name', 'parentId', 'createdAt', 'updatedAt']
    });

    // Build folder tree
    const folderMap = {};
    const rootFolders = [];

    // Create map of folders
    folders.forEach(folder => {
      folderMap[folder.id] = {
        ...folder.toJSON(),
        children: []
      };
    });

    // Build tree structure
    folders.forEach(folder => {
      if (folder.parentId) {
        if (folderMap[folder.parentId]) {
          folderMap[folder.parentId].children.push(folderMap[folder.id]);
        } else {
          // If parent doesn't exist, add to root
          rootFolders.push(folderMap[folder.id]);
        }
      } else {
        rootFolders.push(folderMap[folder.id]);
      }
    });

    return rootFolders;
  } catch (error) {
    console.error('Error getting folder tree:', error);
    throw error;
  }
};

/**
 * Move documents to a folder
 * @param {Array} documentIds - Document IDs
 * @param {string} folderId - Folder ID (null for root)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Updated documents
 */
exports.moveDocumentsToFolder = async (documentIds, folderId, userId) => {
  try {
    // Get user to find organization ID
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if folder exists and belongs to the same organization
    if (folderId) {
      const folder = await Folder.findOne({
        where: {
          id: folderId,
          orgId: user.orgId
        }
      });

      if (!folder) {
        throw new Error('Folder not found');
      }
    }

    // Update documents
    await Document.update(
      { folderId },
      {
        where: {
          id: { [Op.in]: documentIds },
          orgId: user.orgId
        }
      }
    );

    // Get updated documents
    const documents = await Document.findAll({
      where: {
        id: { [Op.in]: documentIds },
        orgId: user.orgId
      },
      include: [
        {
          model: Folder,
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'uploadedBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return documents;
  } catch (error) {
    console.error('Error moving documents:', error);
    throw error;
  }
};

/**
 * Check if a folder is a descendant of another folder
 * @param {string} folderId - Folder ID to check
 * @param {string} ancestorId - Potential ancestor folder ID
 * @returns {Promise<boolean>} - Whether the folder is a descendant
 */
async function isDescendantFolder(folderId, ancestorId) {
  // Base case: if folderId is null, it's not a descendant
  if (!folderId) {
    return false;
  }

  // Get the folder
  const folder = await Folder.findByPk(folderId);
  if (!folder) {
    return false;
  }

  // If this folder's parent is the ancestor, it's a descendant
  if (folder.parentId === ancestorId) {
    return true;
  }

  // Recursively check if the parent is a descendant
  return await isDescendantFolder(folder.parentId, ancestorId);
}
