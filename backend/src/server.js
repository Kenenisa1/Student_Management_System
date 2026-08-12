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
app.listen(PORT, () => {

    console.log("=================================");
    console.log("🚀 Server Started Successfully");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("=================================");

});