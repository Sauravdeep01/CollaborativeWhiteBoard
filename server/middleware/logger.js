const requestLogger = (req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
    next();
};

export { requestLogger };
