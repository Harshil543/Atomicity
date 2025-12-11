import request from 'supertest';
import express from 'express';
import { sequelize } from '../config/database';
import userRoutes from '../routes/userRoutes';
import './models'; // Import models to initialize associations

// Create test app
const app = express();
app.use(express.json());
app.use('/api', userRoutes);

describe('Integration Tests - API Endpoints', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/users - Success Scenario', () => {
    it('should create user with addresses successfully', async () => {
      const requestBody = {
        user: {
          name: 'Integration Test User',
          email: 'integration@test.com',
        },
        addresses: [
          {
            street: '100 Test Street',
            city: 'Test City',
            state: 'TC',
            zipCode: '12345',
            country: 'USA',
          },
          {
            street: '200 Test Avenue',
            city: 'Test Town',
            state: 'TT',
            zipCode: '54321',
            country: 'USA',
          },
        ],
      };

      const response = await request(app)
        .post('/api/users')
        .send(requestBody)
        .expect(201);

      expect(response.body.message).toContain('successfully');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(requestBody.user.email);
      expect(response.body.data.addresses).toHaveLength(2);
    });
  });

  describe('POST /api/users/rollback-test - Rollback Scenario', () => {
    it('should rollback transaction and return error', async () => {
      const requestBody = {
        user: {
          name: 'Rollback Test User',
          email: 'rollback@test.com',
        },
        addresses: [
          {
            street: '300 Rollback St',
            city: 'Rollback City',
            state: 'RC',
            zipCode: '99999',
            country: 'USA',
          },
        ],
      };

      const response = await request(app)
        .post('/api/users/rollback-test')
        .send(requestBody)
        .expect(500);

      expect(response.body.error).toContain('rolled back');
      expect(response.body.message).toBeDefined();

      // Verify no data was persisted
      const usersResponse = await request(app).get('/api/users').expect(200);
      const userExists = usersResponse.body.data.some(
        (u: any) => u.email === requestBody.user.email
      );
      expect(userExists).toBe(false);
    });
  });

  describe('GET /api/users', () => {
    it('should retrieve all users with addresses', async () => {
      // First create a user
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          user: {
            name: 'Get Test User',
            email: 'gettest@test.com',
          },
          addresses: [
            {
              street: '400 Get St',
              city: 'Get City',
              state: 'GC',
              zipCode: '11111',
              country: 'USA',
            },
          ],
        })
        .expect(201);

      // Then retrieve all users
      const response = await request(app).get('/api/users').expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});
