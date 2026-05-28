const { createLogger, format, transports } = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors, json } = format;

// Custom readable format for development console
const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return stack
    ? `${ts} [${level}]: ${message}\n${stack}`
    : `${ts} [${level}]: ${message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "warn" : "debug"),
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" })
  ),
  transports: [
    // Console — colourised in development, plain JSON in production
    new transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? combine(json())
          : combine(colorize({ all: true }), devFormat),
    }),

    // Persistent error log (production)
    new transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      format: combine(json()),
    }),

    // Combined log (production)
    new transports.File({
      filename: path.join("logs", "combined.log"),
      format: combine(json()),
    }),
  ],
  // Do not exit on handled exceptions
  exitOnError: false,
});

// Add http level for morgan stream
logger.http = (message) => logger.log("http", message);

module.exports = logger;
