/**
 * =====================================================
 * errorMiddleware.js
 * -----------------------------------------------------
 * Purpose:
 * Handle application errors globally.
 *
 * IMPORTANT:
 * Error middleware has 4 parameters.
 *
 * err, req, res, next
 *
 * =====================================================
 */


const errorHandler = (err,req,res,next)=>{


    console.error(err.stack);



    res.status(

        err.statusCode || 500

    ).json({

        success:false,

        message:
        err.message ||
        "Internal Server Error"

    });


};



export default errorHandler;