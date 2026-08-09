/**
 * =====================================================
 * db.js
 * -----------------------------------------------------
 * Purpose:
 * Handle MySQL database connection.
 *
 * Responsibilities:
 * 1. Create MySQL connection pool
 * 2. Test database connection
 * 3. Export database functions
 * =====================================================
 */


// Import mysql2 promise version
const mysql = require("mysql2/promise");


// Create MySQL connection pool
// Pool allows multiple database connections
// and improves performance.
const pool = mysql.createPool({

    // Database server address
    host: process.env.DB_HOST,

    // Database port
    port: process.env.DB_PORT,

    // MySQL username
    user: process.env.DB_USER,

    // MySQL password
    password: process.env.DB_PASSWORD,

    // Database name
    database: process.env.DB_NAME,


    // Allow waiting if all connections are busy
    waitForConnections: true,


    // Maximum number of connections
    connectionLimit: 10,


    // Unlimited waiting queue
    queueLimit: 0

});



/**
 * =====================================================
 * connectDB()
 * -----------------------------------------------------
 * Purpose:
 * Test MySQL database connection when server starts.
 * =====================================================
 */

async function connectDB(){

    try{

        // Get one connection from pool
        const connection = await pool.getConnection();


        console.log(
            "✅ MySQL Database Connected Successfully"
        );


        // Release connection back to pool
        connection.release();


    }catch(error){

        console.error(
            "❌ MySQL Database Connection Failed"
        );


        console.error(error.message);


        // Stop application if database fails
        process.exit(1);
    }

}



// Export both
// 1. pool -> used for queries
// 2. connectDB -> used when starting server

module.exports = {

    pool,

    connectDB

};