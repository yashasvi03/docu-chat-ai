const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, param, query } = require('express-validator');

// Import controllers
const documentController = require('../controllers/documentController');

// Import middleware
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept PDFs, DOCXs, XLSXs, TXTs, and CSVs
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'text/csv'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Routes
// GET /api/documents - Get all documents
router.get('/', auth, documentController.getAllDocuments);

// GET /api/documents/:id - Get a specific document
router.get('/:id', auth, param('id').isString(), validate, documentController.getDocumentById);

// POST /api/documents - Upload a new document
router.post('/', auth, upload.single('file'), documentController.uploadDocument);

// POST /api/documents/batch - Upload multiple documents
router.post('/batch', auth, upload.array('files', 10), documentController.uploadMultipleDocuments);

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', auth, param('id').isString(), validate, documentController.deleteDocument);

// PUT /api/documents/:id - Update document metadata
router.put('/:id', 
  auth, 
  param('id').isString(),
  body('name').optional().isString(),
  body('folderId').optional().isString(),
  body('tags').optional().isArray(),
  validate,
  documentController.updateDocument
);

// Folder routes
// GET /api/documents/folders - Get all folders
router.get('/folders', auth, documentController.getAllFolders);

// GET /api/documents/folders/tree - Get folder tree
router.get('/folders/tree', auth, documentController.getFolderTree);

// GET /api/documents/folders/:id - Get a specific folder
router.get('/folders/:id', 
  auth, 
  param('id').isString(), 
  validate, 
  documentController.getFolderById
);

// POST /api/documents/folders - Create a new folder
router.post('/folders', 
  auth, 
  body('name').isString(),
  body('parentId').optional().isString(),
  validate,
  documentController.createFolder
);

// PUT /api/documents/folders/:id - Update a folder
router.put('/folders/:id',
  auth,
  param('id').isString(),
  body('name').optional().isString(),
  body('parentId').optional().isString(),
  validate,
  documentController.updateFolder
);

// DELETE /api/documents/folders/:id - Delete a folder
router.delete('/folders/:id',
  auth,
  param('id').isString(),
  query('recursive').optional().isBoolean(),
  validate,
  documentController.deleteFolder
);

// POST /api/documents/move - Move documents to a folder
router.post('/move',
  auth,
  body('documentIds').isArray(),
  body('folderId').optional().isString(),
  validate,
  documentController.moveDocumentsToFolder
);

// Presigned URL routes
// POST /api/documents/presign - Get presigned URL for upload
router.post('/presign',
  auth,
  body('filename').isString(),
  body('contentType').isString(),
  body('folderId').optional().isString(),
  validate,
  documentController.getPresignedUrl
);

// POST /api/documents/:id/complete - Complete upload
router.post('/:id/complete',
  auth,
  param('id').isString(),
  validate,
  documentController.completeUpload
);

// Google Drive integration
// POST /api/documents/drive/sync - Sync with Google Drive
router.post('/drive/sync', auth, documentController.syncWithGoogleDrive);

// GET /api/documents/drive - Get documents from Google Drive
router.get('/drive', auth, documentController.getGoogleDriveDocuments);

// POST /api/documents/drive/connect - Connect Google Drive
router.post('/drive/connect',
  auth,
  body('code').isString(),
  validate,
  documentController.connectGoogleDrive
);

// GET /api/documents/drive/status - Get Google Drive connection status
router.get('/drive/status', auth, documentController.getGoogleDriveStatus);

// DELETE /api/documents/drive/disconnect - Disconnect Google Drive
router.delete('/drive/disconnect', auth, documentController.disconnectGoogleDrive);

module.exports = router;
