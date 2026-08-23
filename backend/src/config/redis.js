import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

redisClient.on('error', (err) => {
    console.error('[Redis Error]', err.message);
});

redisClient.on('connect', () => {
    console.log('📦 Redis Connected Successfully');
});

export default redisClient;
