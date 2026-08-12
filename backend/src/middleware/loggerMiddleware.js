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

    const start = new Date();

    res.on('finish', () => {
        const duration = new Date() - start;
        console.log(`[${start.toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });

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