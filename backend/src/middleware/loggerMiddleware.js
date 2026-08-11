/**
 * =====================================================
 * loggerMiddleware.js
 * -----------------------------------------------------
 * Purpose:
 * Log every incoming HTTP request.
 *
 * Example:
 *
 * GET /api/students
 *
 * =====================================================
 */


const logger = (req,res,next)=>{


    console.log(
        `${req.method} ${req.originalUrl}`
    );


    console.log(
        "Time:",
        new Date().toISOString()
    );


    /**
     * next()
     *
     * Important:
     * It passes control to the next middleware
     * or route controller.
     */

    next();

};



export default logger;