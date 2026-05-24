import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/veda-ai',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
