/**
 * =====================================================
 * server.js
 * -----------------------------------------------------
 * Purpose:
 * Entry point of the application.
 *
 * Responsibilities:
 * 1. Load environment variables
 * 2. Connect to database
 * 3. Import Express app
 * 4. Start server
 * =====================================================
 */

import "dotenv/config";

// Import configured Express app
import app from "./app.js";

// Import database connection function
import { connectDB } from "./config/db.js";

// Read port from environment variables
const PORT = process.env.PORT || 5000;

/**
 * -----------------------------------------------------
 * Connect to MySQL Database
 * -----------------------------------------------------
 */
connectDB();

/**
 * -----------------------------------------------------
 * Start Express Server
 * -----------------------------------------------------
 */
const server = app.listen(PORT, () => {
    console.log("=================================");
    console.log(" Server Started Successfully");
    console.log(` http://localhost:${PORT}`);
    console.log("=================================");
});

// -----------------------------------------------------
// Graceful Shutdown
// -----------------------------------------------------
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} signal received: closing HTTP server`);
    
    server.close(async () => {
        console.log('HTTP server closed.');
        try {
            // Close database pool
            const { pool } = await import('./config/db.js');
            await pool.end();
            console.log('MySQL Database pool closed.');
            
            // Close Redis connection
            const { default: redisClient } = await import('./config/redis.js');
            await redisClient.quit();
            console.log('Redis connection closed.');
            
            console.log('Graceful shutdown complete.');
            process.exit(0);
        } catch (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));