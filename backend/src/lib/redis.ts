import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
export const redisConnection = { url: redisUrl };

redis.on('error', (err) => console.log('Redis error:', err.message));
