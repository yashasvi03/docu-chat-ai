const chatService = require('../../../src/services/chatService');
const embeddingService = require('../../../src/services/embeddingService');
const Document = require('../../../src/models/Document');
const Chunk = require('../../../src/models/Chunk');
const openai = require('../../../src/config/openai');

// Mock dependencies
jest.mock('../../../src/services/embeddingService');
jest.mock('../../../src/models/Document');
jest.mock('../../../src/models/Chunk');
jest.mock('../../../src/config/openai');

describe('Chat Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('generateChatResponse', () => {
    it('should generate a chat response with citations', async () => {
      // Mock data
      const userId = 'user-123';
      const message = 'What is the monthly growth trend?';
      const folderId = 'folder-123';
      const tags = ['growth', 'trends'];
      
      // Mock embedding generation
      const mockEmbedding = [0.1, 0.2, 0.3];
      embeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      
      // Mock relevant chunks
      const mockChunks = [
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          content: 'The monthly growth trend shows a 5% increase.',
          page: 1,
          similarity: 0.92,
          toObject: () => ({
            id: 'chunk-1',
            documentId: 'doc-1',
            content: 'The monthly growth trend shows a 5% increase.',
            page: 1,
            similarity: 0.92
          })
        },
        {
          id: 'chunk-2',
          documentId: 'doc-2',
          content: 'Growth has been consistent at 5-7% month over month.',
          page: 3,
          similarity: 0.85,
          toObject: () => ({
            id: 'chunk-2',
            documentId: 'doc-2',
            content: 'Growth has been consistent at 5-7% month over month.',
            page: 3,
            similarity: 0.85
          })
        }
      ];
      
      // Mock Chunk.find
      Chunk.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockChunks)
      });
      
      // Mock Document.findById for each document
      const mockDocuments = {
        'doc-1': {
          id: 'doc-1',
          title: 'Monthly Report',
          userId,
          toObject: () => ({
            id: 'doc-1',
            title: 'Monthly Report',
            userId
          })
        },
        'doc-2': {
          id: 'doc-2',
          title: 'Quarterly Analysis',
          userId,
          toObject: () => ({
            id: 'doc-2',
            title: 'Quarterly Analysis',
            userId
          })
        }
      };
      
      Document.findById.mockImplementation((id) => {
        return Promise.resolve(mockDocuments[id]);
      });
      
      // Mock OpenAI response
      const mockOpenAIResponse = {
        choices: [
          {
            message: {
              content: 'Based on the documents, the monthly growth trend is consistently between 5-7%.'
            }
          }
        ]
      };
      openai.chat.completions.create.mockResolvedValue(mockOpenAIResponse);
      
      // Call the service method
      const result = await chatService.generateChatResponse(userId, message, folderId, tags);
      
      // Assertions
      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(message);
      expect(Chunk.find).toHaveBeenCalled();
      expect(Document.findById).toHaveBeenCalledTimes(2);
      expect(openai.chat.completions.create).toHaveBeenCalled();
      
      // Check the result structure
      expect(result).toHaveProperty('message');
      expect(result.message).toHaveProperty('content');
      expect(result.message.content).toBe('Based on the documents, the monthly growth trend is consistently between 5-7%.');
      expect(result).toHaveProperty('citations');
      expect(result.citations).toHaveLength(2);
      expect(result.citations[0]).toHaveProperty('chunkId', 'chunk-1');
      expect(result.citations[0]).toHaveProperty('documentTitle', 'Monthly Report');
      expect(result.citations[1]).toHaveProperty('chunkId', 'chunk-2');
      expect(result.citations[1]).toHaveProperty('documentTitle', 'Quarterly Analysis');
    });
    
    it('should return a "no information" response when no relevant chunks are found', async () => {
      // Mock data
      const userId = 'user-123';
      const message = 'Who won the Premier League in 2024?';
      
      // Mock embedding generation
      const mockEmbedding = [0.1, 0.2, 0.3];
      embeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      
      // Mock empty chunks result
      Chunk.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });
      
      // Call the service method
      const result = await chatService.generateChatResponse(userId, message);
      
      // Assertions
      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(message);
      expect(Chunk.find).toHaveBeenCalled();
      expect(Document.findById).not.toHaveBeenCalled();
      expect(openai.chat.completions.create).not.toHaveBeenCalled();
      
      // Check the result structure
      expect(result).toHaveProperty('message');
      expect(result.message).toHaveProperty('content');
      expect(result.message.content).toContain("I don't have enough information");
      expect(result).toHaveProperty('citations');
      expect(result.citations).toHaveLength(0);
    });
    
    it('should filter chunks by folderId when provided', async () => {
      // Mock data
      const userId = 'user-123';
      const message = 'What is the monthly growth trend?';
      const folderId = 'folder-123';
      
      // Mock embedding generation
      const mockEmbedding = [0.1, 0.2, 0.3];
      embeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      
      // Mock Document.find for folder filtering
      const mockDocumentsInFolder = [
        { id: 'doc-1', userId },
        { id: 'doc-2', userId }
      ];
      Document.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocumentsInFolder)
      });
      
      // Mock relevant chunks
      const mockChunks = [
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          content: 'The monthly growth trend shows a 5% increase.',
          page: 1,
          similarity: 0.92,
          toObject: () => ({
            id: 'chunk-1',
            documentId: 'doc-1',
            content: 'The monthly growth trend shows a 5% increase.',
            page: 1,
            similarity: 0.92
          })
        }
      ];
      
      // Mock Chunk.find
      Chunk.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockChunks)
      });
      
      // Mock Document.findById
      Document.findById.mockResolvedValue({
        id: 'doc-1',
        title: 'Monthly Report',
        userId,
        toObject: () => ({
          id: 'doc-1',
          title: 'Monthly Report',
          userId
        })
      });
      
      // Mock OpenAI response
      const mockOpenAIResponse = {
        choices: [
          {
            message: {
              content: 'Based on the documents, the monthly growth trend is 5%.'
            }
          }
        ]
      };
      openai.chat.completions.create.mockResolvedValue(mockOpenAIResponse);
      
      // Call the service method
      await chatService.generateChatResponse(userId, message, folderId);
      
      // Assertions
      expect(Document.find).toHaveBeenCalledWith({ userId, folderId });
      expect(Chunk.find).toHaveBeenCalled();
      // The query should include the documentId filter
      const chunkFindCall = Chunk.find.mock.calls[0][0];
      expect(chunkFindCall).toHaveProperty('documentId');
      expect(chunkFindCall.documentId.$in).toContain('doc-1');
      expect(chunkFindCall.documentId.$in).toContain('doc-2');
    });
  });
  
  // Add more tests for other chatService methods as needed
});
