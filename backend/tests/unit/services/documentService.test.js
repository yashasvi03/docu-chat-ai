const documentService = require('../../../src/services/documentService');
const Document = require('../../../src/models/Document');
const Chunk = require('../../../src/models/Chunk');
const embeddingService = require('../../../src/services/embeddingService');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../../../src/models/Document');
jest.mock('../../../src/models/Chunk');
jest.mock('../../../src/services/embeddingService');
jest.mock('fs');
jest.mock('path');

describe('Document Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createDocument', () => {
    it('should create a document successfully', async () => {
      // Mock data
      const documentData = {
        title: 'Test Document',
        userId: 'user-123',
        file: {
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          path: '/tmp/test.pdf',
          size: 1024
        },
        folderId: 'folder-123'
      };

      // Mock Document.create
      const createdDocument = {
        id: 'doc-123',
        title: documentData.title,
        userId: documentData.userId,
        mime: documentData.file.mimetype,
        size: documentData.file.size,
        folderId: documentData.folderId,
        status: 'pending',
        toObject: () => ({
          id: 'doc-123',
          title: documentData.title,
          userId: documentData.userId,
          mime: documentData.file.mimetype,
          size: documentData.file.size,
          folderId: documentData.folderId,
          status: 'pending'
        })
      };
      Document.create.mockResolvedValue(createdDocument);

      // Call the service method
      const result = await documentService.createDocument(documentData);

      // Assertions
      expect(Document.create).toHaveBeenCalledWith({
        title: documentData.title,
        userId: documentData.userId,
        mime: documentData.file.mimetype,
        size: documentData.file.size,
        folderId: documentData.folderId,
        status: 'pending'
      });
      expect(result).toEqual({
        id: 'doc-123',
        title: documentData.title,
        userId: documentData.userId,
        mime: documentData.file.mimetype,
        size: documentData.file.size,
        folderId: documentData.folderId,
        status: 'pending'
      });
    });
  });

  describe('getDocumentsByUser', () => {
    it('should get documents for a user', async () => {
      // Mock data
      const userId = 'user-123';
      const folderId = 'folder-123';
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'Document 1',
          userId,
          folderId,
          status: 'ready',
          toObject: () => ({
            id: 'doc-1',
            title: 'Document 1',
            userId,
            folderId,
            status: 'ready'
          })
        },
        {
          id: 'doc-2',
          title: 'Document 2',
          userId,
          folderId,
          status: 'ready',
          toObject: () => ({
            id: 'doc-2',
            title: 'Document 2',
            userId,
            folderId,
            status: 'ready'
          })
        }
      ];

      // Mock Document.find
      Document.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocuments)
      });

      // Call the service method
      const result = await documentService.getDocumentsByUser(userId, folderId);

      // Assertions
      expect(Document.find).toHaveBeenCalledWith({ userId, folderId });
      expect(result).toEqual([
        {
          id: 'doc-1',
          title: 'Document 1',
          userId,
          folderId,
          status: 'ready'
        },
        {
          id: 'doc-2',
          title: 'Document 2',
          userId,
          folderId,
          status: 'ready'
        }
      ]);
    });

    it('should get all documents for a user when folderId is not provided', async () => {
      // Mock data
      const userId = 'user-123';
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'Document 1',
          userId,
          status: 'ready',
          toObject: () => ({
            id: 'doc-1',
            title: 'Document 1',
            userId,
            status: 'ready'
          })
        },
        {
          id: 'doc-2',
          title: 'Document 2',
          userId,
          status: 'ready',
          toObject: () => ({
            id: 'doc-2',
            title: 'Document 2',
            userId,
            status: 'ready'
          })
        }
      ];

      // Mock Document.find
      Document.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocuments)
      });

      // Call the service method
      const result = await documentService.getDocumentsByUser(userId);

      // Assertions
      expect(Document.find).toHaveBeenCalledWith({ userId });
      expect(result).toEqual([
        {
          id: 'doc-1',
          title: 'Document 1',
          userId,
          status: 'ready'
        },
        {
          id: 'doc-2',
          title: 'Document 2',
          userId,
          status: 'ready'
        }
      ]);
    });
  });

  describe('getDocumentById', () => {
    it('should get a document by ID', async () => {
      // Mock data
      const documentId = 'doc-123';
      const userId = 'user-123';
      const mockDocument = {
        id: documentId,
        title: 'Test Document',
        userId,
        status: 'ready',
        toObject: () => ({
          id: documentId,
          title: 'Test Document',
          userId,
          status: 'ready'
        })
      };

      // Mock Document.findOne
      Document.findOne.mockResolvedValue(mockDocument);

      // Call the service method
      const result = await documentService.getDocumentById(documentId, userId);

      // Assertions
      expect(Document.findOne).toHaveBeenCalledWith({ _id: documentId, userId });
      expect(result).toEqual({
        id: documentId,
        title: 'Test Document',
        userId,
        status: 'ready'
      });
    });

    it('should return null if document not found', async () => {
      // Mock data
      const documentId = 'non-existent-id';
      const userId = 'user-123';

      // Mock Document.findOne to return null
      Document.findOne.mockResolvedValue(null);

      // Call the service method
      const result = await documentService.getDocumentById(documentId, userId);

      // Assertions
      expect(Document.findOne).toHaveBeenCalledWith({ _id: documentId, userId });
      expect(result).toBeNull();
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document and its chunks', async () => {
      // Mock data
      const documentId = 'doc-123';
      const userId = 'user-123';
      const mockDocument = {
        id: documentId,
        title: 'Test Document',
        userId,
        status: 'ready',
        toObject: () => ({
          id: documentId,
          title: 'Test Document',
          userId,
          status: 'ready'
        })
      };

      // Mock Document.findOne and deleteOne
      Document.findOne.mockResolvedValue(mockDocument);
      Document.deleteOne.mockResolvedValue({ deletedCount: 1 });
      
      // Mock Chunk.deleteMany
      Chunk.deleteMany.mockResolvedValue({ deletedCount: 5 });

      // Call the service method
      const result = await documentService.deleteDocument(documentId, userId);

      // Assertions
      expect(Document.findOne).toHaveBeenCalledWith({ _id: documentId, userId });
      expect(Document.deleteOne).toHaveBeenCalledWith({ _id: documentId, userId });
      expect(Chunk.deleteMany).toHaveBeenCalledWith({ documentId });
      expect(result).toEqual({
        id: documentId,
        title: 'Test Document',
        userId,
        status: 'ready'
      });
    });

    it('should throw an error if document not found', async () => {
      // Mock data
      const documentId = 'non-existent-id';
      const userId = 'user-123';

      // Mock Document.findOne to return null
      Document.findOne.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(documentService.deleteDocument(documentId, userId)).rejects.toThrow('Document not found');

      // Assertions
      expect(Document.findOne).toHaveBeenCalledWith({ _id: documentId, userId });
      expect(Document.deleteOne).not.toHaveBeenCalled();
      expect(Chunk.deleteMany).not.toHaveBeenCalled();
    });
  });

  // Add more tests for other documentService methods as needed
});
