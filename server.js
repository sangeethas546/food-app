require("dotenv").config();

const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const { Server: SocketServer } = require("socket.io");
const mongoose = require("mongoose");

const app = require("./app");
const logger = require("./utils/logger");
const { registerOrderTrackingSocket } = require("./orderTracking");
const Category = require("./models/Category");
const Product = require("./models/Product");

// ─── Environment validation ───────────────────────────────────────────────────
const NODE_ENV = process.env.NODE_ENV || "development";
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET", "CLIENT_ORIGIN"];
const FALLBACK_ENV = {
  MONGO_URI: "mongodb://127.0.0.1:27017/food",
  JWT_SECRET: "change_this_secret_for_local_dev",
  JWT_REFRESH_SECRET: "change_this_refresh_secret",
  CLIENT_ORIGIN: "http://localhost:3000",
  JWT_EXPIRES_IN: "7d",
  JWT_COOKIE_EXPIRES_IN: "7",
};

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  if (NODE_ENV === "production") {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  missing.forEach((key) => {
    process.env[key] = FALLBACK_ENV[key];
  });
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || FALLBACK_ENV.JWT_EXPIRES_IN;
  process.env.JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN || FALLBACK_ENV.JWT_COOKIE_EXPIRES_IN;
  logger.warn(`Missing environment variables (${missing.join(", ")}); using development defaults.`);
}

const PORT = parseInt(process.env.PORT || "5000", 10);

// ─── HTTP server (wraps Express so Socket.io can share the same port) ─────────
const httpServer = http.createServer(app);

// ─── Socket.io setup ──────────────────────────────────────────────────────────
const socketOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:3000", "http://localhost:5000", "http://127.0.0.1:5000"];

const io = new SocketServer(httpServer, {
  cors: {
    origin: socketOrigins,
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

const seedDefaultData = async () => {
  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0) {
    const categories = [
      { name: "Meals", description: "Complete plates for lunch and dinner." },
      { name: "Pizza", description: "Hot and cheesy pizza favorites." },
      { name: "Starters", description: "Shareable bites to start your meal." },
      { name: "Snacks", description: "Quick bites and crunchy favorites." },
      { name: "Drinks", description: "Cold and hot beverages to refresh." },
      { name: "Desserts", description: "Sweet treats to finish your order." },
      { name: "Bowls", description: "Healthy bowls packed with flavor." },
    ].map((category) => ({ ...category, isActive: true }));

    await Category.insertMany(categories);
    logger.info("Seeded default categories.");
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    const categories = await Category.find();
    const categoryMap = Object.fromEntries(categories.map((category) => [category.name, category._id]));

    const products = [
      {
        title: "Classic Margherita Pizza",
        description: "Fresh mozzarella, basil, and tomato sauce on a hand-stretched crust.",
        price: 12.9,
        category: categoryMap.Pizza,
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
        isAvailable: true,
      },
      {
        title: "BBQ Chicken Pizza",
        description: "Smoky barbeque chicken, red onions, and extra cheese.",
        price: 14.5,
        category: categoryMap.Pizza,
        image: "https://images.unsplash.com/photo-1548365328-4f9464d368d2?auto=format&fit=crop&w=900&q=80",
        isAvailable: true,
      },
      {
        title: "Crispy Chicken Tenders",
        description: "Golden tenders served with honey mustard dip.",
        price: 9.75,
        category: categoryMap.Starters,
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Loaded Nacho Platter",
        description: "Tortilla chips with cheese, jalapeños, salsa, and sour cream.",
        price: 11.4,
        category: categoryMap.Snacks,
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Power Bowl",
        description: "Quinoa, roasted veggies, avocado, and tahini dressing.",
        price: 13.9,
        category: categoryMap.Bowls,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Garden Salad",
        description: "Baby greens, cherry tomatoes, cucumbers, and lemon vinaigrette.",
        price: 8.3,
        category: categoryMap.Meals,
        image: "https://images.unsplash.com/photo-1556911220-e15b29be8c2d?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Fresh Mango Smoothie",
        description: "Creamy mango, yogurt, and honey.",
        price: 6.5,
        category: categoryMap.Drinks,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Iced Latte",
        description: "Cold brew espresso with milk and vanilla.",
        price: 5.0,
        category: categoryMap.Drinks,
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Chocolate Brownie",
        description: "Warm fudgy brownie topped with chocolate sauce.",
        price: 7.0,
        category: categoryMap.Desserts,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Garlic Bread",
        description: "Crispy garlic bread with herb butter and parmesan.",
        price: 5.5,
        category: categoryMap.Starters,
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Fresh Fruit Bowl",
        description: "Seasonal fruit finished with mint and lime.",
        price: 8.8,
        category: categoryMap.Snacks,
        image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=900&q=80",
      },
      {
        title: "Teriyaki Salmon Bowl",
        description: "Grilled salmon, rice, edamame, and sesame dressing.",
        price: 16.9,
        category: categoryMap.Bowls,
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
        isAvailable: true,
      },
    ];

    const productsWithAvailability = products.map((product) => ({
      ...product,
      isAvailable: product.isAvailable !== false,
    }));

    await Product.insertMany(productsWithAvailability);
    logger.info("Seeded default product menu.");
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

const serveClientBuild = () => {
  const clientBuildPath = path.join(__dirname, "mnt", "user-data", "outputs", "client", "build");
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });
    logger.info(`Serving frontend from ${clientBuildPath}`);
  }
};

// ─── Boot sequence ────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  await seedDefaultData();
  serveClientBuild();

  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
    logger.info(`API root: http://localhost:${PORT}/api/v1`);
  });
};

start();
