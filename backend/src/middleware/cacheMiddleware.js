import redisClient from '../config/redis.js';

/**
 * Cache middleware generator.
 * @param {number} ttl - Time to live in seconds.
 */
export const cacheMiddleware = (ttl = 60) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Key based on URL and user role to avoid cross-role leakage
        const key = `cache:${req.originalUrl}:${req.user ? req.user.role : 'guest'}`;

        try {
            const cachedResponse = await redisClient.get(key);
            if (cachedResponse) {
                return res.json(JSON.parse(cachedResponse));
            }
            
            // Override res.json to intercept the response and cache it
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                redisClient.set(key, JSON.stringify(body), 'EX', ttl).catch(err => console.error('Redis cache error:', err));
                return originalJson(body);
            };
            
            next();
        } catch (err) {
            console.error('Redis get error:', err);
            next();
        }
    };
};
