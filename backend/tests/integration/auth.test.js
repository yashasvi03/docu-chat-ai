const request = require('supertest');
const app = require('../../src/index');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');

// Mock User model
jest.mock('../../src/models/User');

describe('Authentication API', () => {
  let token;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a test token for authenticated routes
    token = jwt.sign(
      { id: 'test-user-id', email: 'test@example.com' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
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
        id: 'test-user-id',
        name: userData.name,
        email: userData.email,
        role: 'user',
        toObject: () => ({
          id: 'test-user-id',
          name: userData.name,
          email: userData.email,
          role: 'user'
        })
      };
      User.create.mockResolvedValue(createdUser);
      
      // Make the request
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Assertions
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toHaveProperty('id', 'test-user-id');
      expect(res.body.data.user).toHaveProperty('name', userData.name);
      expect(res.body.data.user).toHaveProperty('email', userData.email);
      expect(res.body.data).toHaveProperty('token');
      
      // Verify the mocks were called correctly
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalled();
    });
    
    it('should return 400 if user already exists', async () => {
      // Mock data
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne to return an existing user
      User.findOne.mockResolvedValue({ email: userData.email });
      
      // Make the request
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Assertions
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'User already exists');
      
      // Verify the mocks were called correctly
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock data with missing fields
      const userData = {
        name: 'Test User',
        // email is missing
        password: 'password123'
      };
      
      // Make the request
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Assertions
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errors');
      
      // Verify the mocks were not called
      expect(User.findOne).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('should login a user successfully', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne to return a user
      const mockUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: loginData.email,
        password: '$2a$10$somehashedpassword',
        comparePassword: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          id: 'test-user-id',
          name: 'Test User',
          email: loginData.email,
          role: 'user'
        })
      };
      User.findOne.mockResolvedValue(mockUser);
      
      // Make the request
      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assertions
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toHaveProperty('id', 'test-user-id');
      expect(res.body.data.user).toHaveProperty('email', loginData.email);
      expect(res.body.data).toHaveProperty('token');
      
      // Verify the mocks were called correctly
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
    });
    
    it('should return 401 if user not found', async () => {
      // Mock data
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      // Mock User.findOne to return null
      User.findOne.mockResolvedValue(null);
      
      // Make the request
      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assertions
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
      
      // Verify the mocks were called correctly
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
    });
    
    it('should return 401 if password is incorrect', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      // Mock User.findOne to return a user
      const mockUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: loginData.email,
        password: '$2a$10$somehashedpassword',
        comparePassword: jest.fn().mockResolvedValue(false),
        toObject: () => ({
          id: 'test-user-id',
          name: 'Test User',
          email: loginData.email,
          role: 'user'
        })
      };
      User.findOne.mockResolvedValue(mockUser);
      
      // Make the request
      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assertions
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
      
      // Verify the mocks were called correctly
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
    });
  });
  
  describe('GET /api/auth/me', () => {
    it('should return the current user', async () => {
      // Mock User.findById to return a user
      const mockUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        toObject: () => ({
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        })
      };
      User.findById.mockResolvedValue(mockUser);
      
      // Make the request
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      // Assertions
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', 'test-user-id');
      expect(res.body.data).toHaveProperty('name', 'Test User');
      expect(res.body.data).toHaveProperty('email', 'test@example.com');
      
      // Verify the mocks were called correctly
      expect(User.findById).toHaveBeenCalledWith('test-user-id');
    });
    
    it('should return 401 if no token is provided', async () => {
      // Make the request without a token
      const res = await request(app)
        .get('/api/auth/me');
      
      // Assertions
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', true);
      
      // Verify the mocks were not called
      expect(User.findById).not.toHaveBeenCalled();
    });
    
    it('should return 401 if token is invalid', async () => {
      // Make the request with an invalid token
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      
      // Assertions
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', true);
      
      // Verify the mocks were not called
      expect(User.findById).not.toHaveBeenCalled();
    });
    
    it('should return 404 if user not found', async () => {
      // Mock User.findById to return null
      User.findById.mockResolvedValue(null);
      
      // Make the request
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      // Assertions
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'User not found');
      
      // Verify the mocks were called correctly
      expect(User.findById).toHaveBeenCalledWith('test-user-id');
    });
  });
});
