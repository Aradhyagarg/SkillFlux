export const ErrorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({ // we will not get statuscode so we make a errorHandler
        success: false,
        message: err.message,
    })
}