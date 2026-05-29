const logger = require("../utils/logger");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(`'${value}' is already in use for field '${field}'.`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

const handleCastError = (err) => {
  return new AppError(`Invalid value '${err.value}' for field '${err.path}'.`, 400);
};

const handleJWTError = () => new AppError("Invalid token. Please log in again.", 401);
const handleJWTExpiredError = () => new AppError("Token expired. Please log in again.", 401);

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === "ValidationError") error = handleValidationError(err);
  if (err.name === "CastError") error = handleCastError(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const status = error.status || "error";

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${error.message}`, {
      stack: err.stack,
      body: req.body,
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} — ${statusCode}: ${error.message}`);
  }

  res.status(statusCode).json({
    success: false,
    status,
    message: error.message || "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { AppError, asyncHandler, notFound, errorHandler };
