require("dotenv").config();

const http = require("http");
const { Server: SocketServer } = require("socket.io");
const mongoose = require("mongoose");

const app = require("./app");
const logger = require("./utils/logger");
const { registerOrderTrackingSocket } = require("./orderTracking");

// ─── Environment validation ───────────────────────────────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET", "CLIENT_ORIGIN"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || "5000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

// ─── HTTP server (wraps Express so Socket.io can share the same port) ─────────
const httpServer = http.createServer(app);

// ─── Socket.io setup ──────────────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim()),
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Attach io to the Express app so controllers can emit events (e.g. order updates)
app.set("io", io);

// Register all socket event handlers
registerOrderTrackingSocket(io);

// ─── MongoDB connection ───────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 7+ removes deprecated options — these are the relevant ones
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host} (${NODE_ENV})`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

// ─── Mongoose event listeners ─────────────────────────────────────────────────
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected — attempting reconnect...");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);

  httpServer.close(async () => {
    logger.info("HTTP server closed");

    try {
      await mongoose.connection.close(false);
      logger.info("MongoDB connection closed");
      process.exit(0);
    } catch (err) {
      logger.error(`Error during MongoDB close: ${err.message}`);
      process.exit(1);
    }
  });

  // Force-kill if graceful shutdown takes too long
  setTimeout(() => {
    logger.error("Graceful shutdown timeout — forcing exit");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ─── Catch unhandled promise rejections & exceptions ─────────────────────────
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  gracefulShutdown("uncaughtException");
});

// ─── Boot sequence ────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
  });
};

start();
