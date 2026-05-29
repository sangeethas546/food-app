const { createLogger, format, transports } = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors, json } = format;

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
    new transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? combine(json())
          : combine(colorize({ all: true }), devFormat),
    }),
    new transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      format: combine(json()),
    }),
    new transports.File({
      filename: path.join("logs", "combined.log"),
      format: combine(json()),
    }),
  ],
  exitOnError: false,
});

logger.http = (message) => logger.log("http", message);

module.exports = logger;
