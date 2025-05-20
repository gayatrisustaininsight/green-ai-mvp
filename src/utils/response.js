/**
 * Send a standardized success response
 * @param {object} res - Express response object
 * @param {object} options
 * @param {number} options.statusCode - HTTP status code (default 200)
 * @param {string} options.message - Response message
 * @param {object} options.data - Data payload (optional)
 */
function successResponse(res, { statusCode = 200, message = 'Success', data = null }) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}

/**
 * Send a standardized error response
 * @param {object} res - Express response object
 * @param {object} options
 * @param {number} options.statusCode - HTTP status code (default 500)
 * @param {string} options.message - Error message
 * @param {object} options.errors - Detailed error info (optional)
 */
function errorResponse(res, { statusCode = 500, message = 'Internal Server Error', errors = null }) {
    const responsePayload = {
        success: false,
        message,
    };
    if (errors) responsePayload.errors = errors;
    return res.status(statusCode).json(responsePayload);
}

module.exports = {
    successResponse,
    errorResponse,
};
