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

// Load variables from .env
require("dotenv").config();

// Import configured Express app
const app = require("./app");

// Import database connection function
const { connectDB } = require("./config/db");

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