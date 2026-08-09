/**
 * =====================================================
 * app.js
 * -----------------------------------------------------
 * Purpose:
 * This file configures the Express application.
 *
 * Responsibilities:
 *
 * 1. Create Express application
 * 2. Register built-in middleware
 * 3. Register custom middleware
 * 4. Register API routes
 * 5. Handle unknown routes (404)
 * 6. Handle application errors
 * 7. Export configured app
 *
 * =====================================================
 */


// Import Express framework
const express = require("express");



// Create Express application
const app = express();





/**
 * =====================================================
 * 1. BUILT-IN MIDDLEWARE
 * =====================================================
 */


// Allows Express to read JSON data
//
// Example request body:
//
// {
//    "name":"Getachew",
//    "email":"test@gmail.com"
// }
//
// Access using:
// req.body.name

app.use(express.json());




// Allows receiving form data
//
// Example:
// name=Getachew&email=test@gmail.com

app.use(
    express.urlencoded({
        extended:true
    })
);







/**
 * =====================================================
 * 2. CUSTOM LOGGER MIDDLEWARE
 * =====================================================
 *
 * Purpose:
 * Display every incoming request.
 *
 * Example output:
 *
 * GET /api/students
 *
 */


const logger =
require("./middleware/loggerMiddleware");


// Every request passes through logger

app.use(logger);







/**
 * =====================================================
 * 3. ROUTES
 * =====================================================
 *
 * Import student routes.
 *
 * Actual routes:
 *
 * POST
 *      /api/students
 *
 * GET
 *      /api/students
 *
 * GET
 *      /api/students/:id
 *
 * PUT
 *      /api/students/:id
 *
 * DELETE
 *      /api/students/:id
 *
 */


const studentRoutes =
require("./routes/studentRoutes");



// Register student routes

app.use(

    "/api/students",

    studentRoutes

);







/**
 * =====================================================
 * 4. ROOT ROUTE
 * =====================================================
 *
 * Purpose:
 * Check whether API is running.
 *
 * URL:
 *
 * GET /
 *
 */


app.get("/",(req,res)=>{


    res.json({

        success:true,

        message:
        "Welcome to Student Management API"

    });


});








/**
 * =====================================================
 * 5. 404 NOT FOUND MIDDLEWARE
 * =====================================================
 *
 * IMPORTANT:
 *
 * This must come AFTER routes.
 *
 * If no route matches,
 * this middleware executes.
 *
 */


const notFound =
require("./middleware/notFoundMiddleware");


app.use(notFound);








/**
 * =====================================================
 * 6. GLOBAL ERROR HANDLER
 * =====================================================
 *
 * IMPORTANT:
 *
 * This must be the LAST middleware.
 *
 * Handles all application errors.
 *
 */


const errorHandler =
require("./middleware/errorMiddleware");


app.use(errorHandler);







/**
 * =====================================================
 * EXPORT APPLICATION
 * =====================================================
 *
 * server.js imports this app
 *
 * =====================================================
 */


module.exports = app;