const userService = require('../../../src/services/userService');
const User = require('../../../src/models/User');

// Mock the User model
jest.mock('../../../src/models/User');

describe('User Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Mock data
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock User.findOne to return null (user doesn't exist)
      User.findOne.mockResolvedValue(null);

      // Mock User.create to return the created user
      const createdUser = {
        id: 'user-id-123',
        name: userData.name,
        email: userData.email,
        role: 'user',
        toObject: () => ({
          id: 'user-id-123',
          name: userData.name,
          email: userData.email,
          role: 'user'
        })
      };
      User.create.mockResolvedValue(createdUser);

      // Call the service method
      const result = await userService.createUser(userData);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'user-id-123',
        name: userData.name,
        email: userData.email,
        role: 'user'
      });
    });

    it('should throw an error if user already exists', async () => {
      // Mock data
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock User.findOne to return an existing user
      User.findOne.mockResolvedValue({ email: userData.email });

      // Call the service method and expect it to throw
      await expect(userService.createUser(userData)).rejects.toThrow('User already exists');

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('findUserById', () => {
    it('should find a user by ID', async () => {
      // Mock data
      const userId = 'user-id-123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        toObject: () => ({
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        })
      };

      // Mock User.findById
      User.findById.mockResolvedValue(mockUser);

      // Call the service method
      const result = await userService.findUserById(userId);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      });
    });

    it('should return null if user not found', async () => {
      // Mock data
      const userId = 'non-existent-id';

      // Mock User.findById to return null
      User.findById.mockResolvedValue(null);

      // Call the service method
      const result = await userService.findUserById(userId);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should find a user by email', async () => {
      // Mock data
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-id-123',
        name: 'Test User',
        email: email,
        role: 'user',
        toObject: () => ({
          id: 'user-id-123',
          name: 'Test User',
          email: email,
          role: 'user'
        })
      };

      // Mock User.findOne
      User.findOne.mockResolvedValue(mockUser);

      // Call the service method
      const result = await userService.findUserByEmail(email);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual({
        id: 'user-id-123',
        name: 'Test User',
        email: email,
        role: 'user'
      });
    });

    it('should return null if user not found by email', async () => {
      // Mock data
      const email = 'nonexistent@example.com';

      // Mock User.findOne to return null
      User.findOne.mockResolvedValue(null);

      // Call the service method
      const result = await userService.findUserByEmail(email);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email });
      expect(result).toBeNull();
    });
  });

  // Add more tests for other userService methods as needed
});
