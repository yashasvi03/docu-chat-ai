const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, param, query } = require('express-validator');

// Import controllers
const documentController = require('../controllers/documentController');

// Import middleware
const auth = require('../middleware/auth');
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

// GET /api/documents/folders - Get all folders
router.get('/folders', auth, documentController.getAllFolders);

// POST /api/documents/folders - Create a new folder
router.post('/folders', 
  auth, 
  body('name').isString(),
  body('parentId').optional().isString(),
  validate,
  documentController.createFolder
);

// Google Drive integration
// POST /api/documents/drive/sync - Sync with Google Drive
router.post('/drive/sync', auth, documentController.syncWithGoogleDrive);

// GET /api/documents/drive - Get documents from Google Drive
router.get('/drive', auth, documentController.getGoogleDriveDocuments);

module.exports = router;
