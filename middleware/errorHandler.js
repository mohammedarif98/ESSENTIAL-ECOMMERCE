
const path = require('path');
const User = require('../models/userModel');


//---------- 404 Error Handler
async function notFoundHandler(req, res, next) {
    try {
        let user = null;
        if (req.session?.user_id) {
            user = await User.findById(req.session.user_id);
        }
        res.status(404).render('404ErrorPage', { user });
    } catch (error) {
        next(error); 
    }
}

//------------ 500 error handler
async function errorHandler(err, req, res, next) {
    try {
        let user = null;
        if (req.session?.user_id) {
            user = await User.findById(req.session.user_id);
        }

        // Log the error stack and request details for debugging purposes
        console.error("Error occurred:", {
            message: err.message,
            stack: err.stack,
            user: user ? user.id : 'Not logged in',
            route: req.originalUrl
        });

        // Respond with an appropriate status code and error page
        res.status(err.status || 500).render('500ErrorPage', {
            errorMessage: err.message,
            user: user
        });
    } catch (internalError) {
        // If an error occurs in the error handler, pass it to the next error handler
        console.error("Error in error handler:", internalError);
        next(internalError);
    }
}


module.exports = {
    notFoundHandler,
    errorHandler,
};







// const errorHandler = async(err,req,res,next) => {
//     console.log("middleware  error handling");
//     const errStatus = err.errStatusCode || 500;
//     const errMsg =  err.message || 'something went wrong';
//     res.status(errStatus).json({
//         success : false,
//         status : errStatus,
//         message : errMsg,
//         stack : process.env.NODE_ENV === 'development' ? err.stack : {}     //* err.stack shows the exact file and line number the error occured. 
//     })
// }




// export default errorHandler ;