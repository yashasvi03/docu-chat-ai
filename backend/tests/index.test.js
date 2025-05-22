const request = require('supertest');
const app = require('../src/index');

describe('API Endpoints', () => {
  // Health check endpoint test
  describe('GET /api/health', () => {
    it('should return 200 and status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('message', 'Server is running');
    });
  });

  // Basic route tests
  describe('API Routes', () => {
    it('should return 401 for protected routes without auth', async () => {
      const routes = [
        '/api/documents',
        '/api/chat/history',
        '/api/auth/me'
      ];

      for (const route of routes) {
        const res = await request(app).get(route);
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('error', true);
      }
    });
  });
});
