process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "integration_test_secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.JWT_COOKIE_EXPIRES_IN = "1";

const express = require("express");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { protect } = require("../controllers/authController");
const { AppError } = require("../middleware/error");
const appMain = require("../app");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

jest.setTimeout(30000);

const buildTestApp = () => {
  const app = express();
  app.use(express.json());

  app.put("/api/orders/:id/payment", async (req, res, next) => {
    try {
      await protect(req, res, async () => {
        const order = await Order.findById(req.params.id);
        if (!order) {
          return next(new AppError("Order not found.", 404));
        }

        const { paymentMethod } = req.body;
        const allowedMethods = ["Cash on Delivery", "UPI"];
        if (!allowedMethods.includes(paymentMethod)) {
          return next(new AppError("Invalid payment method.", 400));
        }

        order.paymentMethod = paymentMethod;
        await order.save();

        res.status(200).json({
          success: true,
          order,
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((req, res, next) => {
    if (req.path === "/api/menu" || req.path.startsWith("/api/menu/")) {
      req.url = req.url.replace(/^\/api\/menu/, "/api/v1/products");
    } else if (req.method === "POST" && req.path === "/api/orders") {
      req.url = "/api/v1/orders";
    } else if (req.method === "PATCH" && /^\/api\/orders\/[^/]+\/status$/.test(req.path)) {
      req.url = req.url.replace(/^\/api\/orders\/([^/]+)\/status$/, "/api/v1/delivery/$1");
    }
    next();
  });

  app.use(appMain);
  return app;
};

let mongoServer;
let app;

const initializeMongoServer = async () => {
  if (process.env.TEST_MONGO_URI) {
    return process.env.TEST_MONGO_URI;
  }

  mongoServer = await MongoMemoryServer.create();
  return mongoServer.getUri();
};

const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
};

const registerUser = async (user) => {
  const response = await request(app).post("/api/v1/auth/register").send(user);
  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
  expect(response.body.token).toBeTruthy();
  return response.body;
};

const loginUser = async (email, password) => {
  const response = await request(app).post("/api/v1/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  return response.body;
};

describe("Food Delivery App Integration Tests", () => {
  beforeAll(async () => {
    const uri = await initializeMongoServer();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    app = buildTestApp();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("completes user checkout workflow with auth, menu lookup, order creation, and stock decrement", async () => {
    const category = await Category.create({
      name: "Burgers",
      description: "Savory burger options",
    });

    const insertResult = await Product.collection.insertOne({
      title: "Double Cheese Burger",
      description: "A juicy burger with two cheese slices.",
      price: 12.5,
      category: category._id,
      isAvailable: true,
      quantity: 10,
    });

    const productId = insertResult.insertedId;

    const userPayload = await registerUser({
      name: "Alice Checkout",
      email: "alice.checkout@test.com",
      password: "Password123",
      address: "123 Test Avenue",
    });

    const token = userPayload.token;

    const menuResponse = await request(app)
      .get("/api/menu")
      .set("Authorization", `Bearer ${token}`);

    expect(menuResponse.status).toBe(200);
    expect(menuResponse.body.success).toBe(true);
    expect(Array.isArray(menuResponse.body.products)).toBe(true);
    expect(menuResponse.body.products).toHaveLength(1);
    expect(menuResponse.body.products[0].title).toBe("Double Cheese Burger");

    await Cart.create({
      user: mongoose.Types.ObjectId(userPayload.user._id),
      items: [
        {
          product: productId,
          name: "Double Cheese Burger",
          quantity: 2,
          price: 12.5,
        },
      ],
    });

    const checkoutResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: "123 Test Avenue",
        paymentMethod: "UPI",
      });

    expect(checkoutResponse.status).toBe(201);
    expect(checkoutResponse.body.success).toBe(true);
    expect(checkoutResponse.body.order).toBeDefined();
    expect(checkoutResponse.body.order.shippingAddress).toBe("123 Test Avenue");
    expect(checkoutResponse.body.order.paymentMethod).toBe("UPI");
    expect(checkoutResponse.body.order.items).toHaveLength(1);

    const createdOrder = await Order.findById(checkoutResponse.body.order._id).lean();
    expect(createdOrder).not.toBeNull();
    expect(createdOrder.user.toString()).toBe(userPayload.user._id.toString());
    expect(createdOrder.items[0].quantity).toBe(2);

    const productAfter = await Product.collection.findOne({ _id: productId });
    expect(productAfter).not.toBeNull();
    expect(productAfter.quantity).toBe(8);
  });

  it("blocks order status updates for a customer and allows a delivery partner to complete the same workflow", async () => {
    const category = await Category.create({
      name: "Pizza",
      description: "Oven-baked pizza selections",
    });

    const product = await Product.create({
      title: "Margherita Pizza",
      description: "Fresh tomatoes, mozzarella and basil.",
      price: 14.5,
      category: category._id,
      isAvailable: true,
    });

    const customer = await registerUser({
      name: "Customer Token",
      email: "customer.token@test.com",
      password: "Password123",
      address: "456 Delivery Lane",
    });

    const driverUser = await User.create({
      name: "Delivery Driver",
      email: "driver.token@test.com",
      password: "Password123",
      role: "driver",
      address: "789 Driver Road",
    });

    const driverLogin = await loginUser("driver.token@test.com", "Password123");

    await Cart.create({
      user: mongoose.Types.ObjectId(customer.user._id),
      items: [
        {
          product: product._id,
          name: product.title,
          quantity: 1,
          price: product.price,
        },
      ],
    });

    const orderResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({
        shippingAddress: "456 Delivery Lane",
        paymentMethod: "Cash on Delivery",
      });

    expect(orderResponse.status).toBe(201);
    const orderId = orderResponse.body.order._id;

    const customerStatusResponse = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${customer.token}`)
      .send({ status: "out_for_delivery" });

    expect(customerStatusResponse.status).toBe(403);
    expect(customerStatusResponse.body.success).toBe(false);
    expect(customerStatusResponse.body.message).toBe("You do not have permission to perform this action.");

    const driverStatusResponse = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${driverLogin.token}`)
      .send({ status: "out_for_delivery" });

    expect(driverStatusResponse.status).toBe(200);
    expect(driverStatusResponse.body.success).toBe(true);
    expect(driverStatusResponse.body.order.status).toBe("out_for_delivery");

    const updatedOrder = await Order.findById(orderId).lean();
    expect(updatedOrder.status).toBe("out_for_delivery");
  });

  it("rejects invalid checkout data and ensures no partial order is written to the database", async () => {
    const category = await Category.create({
      name: "Salads",
      description: "Fresh salad bowls",
    });

    const unavailableProduct = await Product.collection.insertOne({
      title: "Seasonal Salad",
      description: "Seasonal greens and toppings.",
      price: 9.5,
      category: category._id,
      isAvailable: false,
      quantity: 0,
    });

    const userPayload = await registerUser({
      name: "Rollback User",
      email: "rollback.user@test.com",
      password: "Password123",
      address: "321 Recovery Blvd",
    });

    await Cart.create({
      user: mongoose.Types.ObjectId(userPayload.user._id),
      items: [
        {
          product: unavailableProduct.insertedId,
          name: "Seasonal Salad",
          quantity: 1,
          price: -5,
        },
      ],
    });

    const checkoutResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userPayload.token}`)
      .send({
        shippingAddress: "321 Recovery Blvd",
        paymentMethod: "UPI",
      });

    expect(checkoutResponse.status).toBe(400);
    expect(checkoutResponse.body.success).toBe(false);
    expect(checkoutResponse.body.message).toContain("Validation failed:");

    const orderCount = await Order.countDocuments();
    expect(orderCount).toBe(0);

    const savedCart = await Cart.findOne({ user: userPayload.user._id }).lean();
    expect(savedCart).not.toBeNull();
    expect(savedCart.items).toHaveLength(1);
  });
});
