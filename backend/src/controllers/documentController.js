const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const pdfParse = require('pdf-parse');

// Import services
const documentService = require('../services/documentService');
const embeddingService = require('../services/embeddingService');

/**
 * Get all documents
 * @route GET /api/documents
 */
exports.getAllDocuments = async (req, res) => {
  try {
    const { folderId, tags } = req.query;
    const userId = req.user.id;
    
    const documents = await documentService.getAllDocuments(userId, folderId, tags);
    
    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get documents'
    });
  }
};

/**
 * Get document by ID
 * @route GET /api/documents/:id
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const document = await documentService.getDocumentById(id, userId);
    
    if (!document) {
      return res.status(404).json({
        error: true,
        message: 'Document not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get document'
    });
  }
};

/**
 * Upload a document
 * @route POST /api/documents
 */
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No file uploaded'
      });
    }
    
    const userId = req.user.id;
    const { folderId, tags } = req.body;
    const file = req.file;
    
    // Upload file to S3
    const s3Key = `documents/${userId}/${Date.now()}-${file.originalname}`;
    const s3Url = await uploadToS3(file.buffer, s3Key, file.mimetype);
    
    // Extract text from document
    const text = await extractTextFromDocument(file);
    
    // Create document in database
    const document = await documentService.createDocument({
      userId,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      url: s3Url,
      folderId: folderId || null,
      tags: tags ? JSON.parse(tags) : []
    });
    
    // Generate embeddings and store in vector database
    await embeddingService.processDocument(document.id, text);
    
    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to upload document'
    });
  }
};

/**
 * Upload multiple documents
 * @route POST /api/documents/batch
 */
exports.uploadMultipleDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No files uploaded'
      });
    }
    
    const userId = req.user.id;
    const { folderId, tags } = req.body;
    
    const uploadPromises = req.files.map(async (file) => {
      // Upload file to S3
      const s3Key = `documents/${userId}/${Date.now()}-${file.originalname}`;
      const s3Url = await uploadToS3(file.buffer, s3Key, file.mimetype);
      
      // Extract text from document
      const text = await extractTextFromDocument(file);
      
      // Create document in database
      const document = await documentService.createDocument({
        userId,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        url: s3Url,
        folderId: folderId || null,
        tags: tags ? JSON.parse(tags) : []
      });
      
      // Generate embeddings and store in vector database
      await embeddingService.processDocument(document.id, text);
      
      return document;
    });
    
    const documents = await Promise.all(uploadPromises);
    
    res.status(201).json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to upload documents'
    });
  }
};

/**
 * Delete a document
 * @route DELETE /api/documents/:id
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const document = await documentService.getDocumentById(id, userId);
    
    if (!document) {
      return res.status(404).json({
        error: true,
        message: 'Document not found'
      });
    }
    
    // Delete from S3
    if (document.url) {
      const s3Key = document.url.split('/').slice(-1)[0];
      await deleteFromS3(s3Key);
    }
    
    // Delete embeddings from vector database
    await embeddingService.deleteDocumentEmbeddings(id);
    
    // Delete document from database
    await documentService.deleteDocument(id, userId);
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete document'
    });
  }
};

/**
 * Update document metadata
 * @route PUT /api/documents/:id
 */
exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    
    const document = await documentService.getDocumentById(id, userId);
    
    if (!document) {
      return res.status(404).json({
        error: true,
        message: 'Document not found'
      });
    }
    
    const updatedDocument = await documentService.updateDocument(id, userId, updates);
    
    res.status(200).json({
      success: true,
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update document'
    });
  }
};

/**
 * Get all folders
 * @route GET /api/documents/folders
 */
exports.getAllFolders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const folders = await documentService.getAllFolders(userId);
    
    res.status(200).json({
      success: true,
      data: folders
    });
  } catch (error) {
    console.error('Error getting folders:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get folders'
    });
  }
};

/**
 * Create a folder
 * @route POST /api/documents/folders
 */
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const userId = req.user.id;
    
    const folder = await documentService.createFolder({
      name,
      userId,
      parentId: parentId || null
    });
    
    res.status(201).json({
      success: true,
      data: folder
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create folder'
    });
  }
};

/**
 * Sync with Google Drive
 * @route POST /api/documents/drive/sync
 */
exports.syncWithGoogleDrive = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // This would be implemented with Google Drive API
    // For now, return a mock response
    res.status(200).json({
      success: true,
      message: 'Google Drive sync initiated',
      data: {
        syncId: 'sync_' + Date.now(),
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Error syncing with Google Drive:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to sync with Google Drive'
    });
  }
};

/**
 * Get documents from Google Drive
 * @route GET /api/documents/drive
 */
exports.getGoogleDriveDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // This would be implemented with Google Drive API
    // For now, return a mock response
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error getting Google Drive documents:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get Google Drive documents'
    });
  }
};

// Helper functions

/**
 * Upload a file to S3 or local filesystem
 * @param {Buffer} buffer - File buffer
 * @param {string} key - S3 key or local file path
 * @param {string} contentType - File content type
 * @returns {Promise<string>} - File URL
 */
const uploadToS3 = async (buffer, key, contentType) => {
  // In development mode, save to local filesystem
  if (process.env.NODE_ENV === 'development') {
    const filePath = path.join(__dirname, '../../uploads', key);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, buffer);
    
    // Return local URL
    return `/uploads/${key}`;
  }
  
  // In production, upload to S3
  // Configure AWS SDK
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  };
  
  const result = await s3.upload(params).promise();
  return result.Location;
};

/**
 * Delete a file from S3 or local filesystem
 * @param {string} key - S3 key or local file path
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (key) => {
  // In development mode, delete from local filesystem
  if (process.env.NODE_ENV === 'development') {
    const filePath = path.join(__dirname, '../../uploads', key);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return;
  }
  
  // In production, delete from S3
  // Configure AWS SDK
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  };
  
  await s3.deleteObject(params).promise();
};

/**
 * Extract text from a document
 * @param {Object} file - File object
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromDocument = async (file) => {
  const buffer = file.buffer;
  const mimetype = file.mimetype;
  
  // Extract text based on file type
  if (mimetype === 'application/pdf') {
    const pdfData = await pdfParse(buffer);
    return pdfData.text;
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // DOCX extraction would be implemented here
    // For now, return a placeholder
    return 'DOCX text extraction placeholder';
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimetype === 'text/csv') {
    // XLSX/CSV extraction would be implemented here
    // For now, return a placeholder
    return 'XLSX/CSV text extraction placeholder';
  } else if (mimetype === 'text/plain') {
    return buffer.toString('utf-8');
  } else {
    throw new Error('Unsupported file type');
  }
};
