const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: 'Invalid JSON request body'
        });
    }

    const statusCode = err.statusCode || err.status || 500;

    if (statusCode >= 500) {
        console.error(err);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }

    res.status(statusCode).json({
        message: err.message || 'Request failed'
    });
};

module.exports = errorHandler;
