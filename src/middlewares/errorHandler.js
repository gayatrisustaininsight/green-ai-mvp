// src/middlewares/errorHandler.js

module.exports = (err, req, res, next) => {
    console.error(err); // log error for debugging

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
};
