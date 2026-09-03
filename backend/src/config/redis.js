import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// ── Client 1: For Caching & Rate Limiting (Fail-Fast Strategy) ──
export const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    retryStrategy: () => null // Stop retrying immediately
});

// ── Client 2: For BullMQ Queues (Must have maxRetriesPerRequest: null) ──
export const queueConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});

redisClient.on('error', (err) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error('[Redis Client Error]', err.message);
    }
});

queueConnection.on('error', (err) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error('[Redis Queue Error]', err.message);
    }
});

export default redisClient;
