import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'mydb',
  process.env.DB_USERNAME || 'admin',
  process.env.DB_PASSWORD || 'admin123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Sync models with database (creates tables if they don't exist)
    // In production, use migrations instead of sync
    await sequelize.sync({ alter: false }); // Set to true to alter existing tables
    console.log('Database models synchronized');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};
