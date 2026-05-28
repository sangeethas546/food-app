const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const logger = require("./utils/logger");
const { errorHandler, notFound } = require("./middleware/error");

// ─── Route imports (stubs ready for Step 2 onwards) ───────────────────────────
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/category");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const deliveryRoutes = require("./routes/delivery");
const adminRoutes = require("./routes/admin");

const app = express();

// ─── Trust proxy (required when behind Nginx / load balancer) ─────────────────
app.set("trust proxy", 1);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server requests (no origin header) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — try again later." },
});
app.use("/api", globalLimiter);

// Stricter limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts — try again in 15 minutes." },
});

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ─── Data sanitisation ────────────────────────────────────────────────────────
// Strips keys that start with '$' or contain '.' to prevent NoSQL injection
app.use(mongoSanitize());

// Prevents HTTP Parameter Pollution (e.g. ?sort=price&sort=name)
app.use(hpp({ whitelist: ["price", "rating", "category"] }));

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── HTTP request logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  // In production, pipe morgan output through Winston so logs are structured
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// ─── Static files (uploaded images) ───────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ─── Health check (no auth, no rate limit) ────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/delivery", deliveryRoutes);
app.use("/api/v1/admin", adminRoutes);

// ─── 404 handler (must come after all routes) ─────────────────────────────────
app.use(notFound);

// ─── Centralised error handler (must be last middleware) ──────────────────────
app.use(errorHandler);

module.exports = app;
