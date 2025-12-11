import { sequelize } from '../config/database';
import { User, Address } from '../models';

// Setup: Initialize database before tests
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('Test database connected');
    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ force: false }); // Set to true to drop and recreate tables
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
});

// Cleanup: Close database connection after all tests
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Error closing test database:', error);
  }
});

// Clean up data after each test
afterEach(async () => {
  try {
    await Address.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
});
