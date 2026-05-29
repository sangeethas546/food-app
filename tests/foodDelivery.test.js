const express = require("express");
const request = require("supertest");

jest.mock("../models/Product", () => ({
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../models/Category", () => ({
  findOne: jest.fn(),
}));

jest.mock("../models/Cart", () => ({
  findOne: jest.fn(),
  findOneAndDelete: jest.fn(),
}));

jest.mock("../models/Order", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
}));

jest.mock("../orderTracking", () => ({
  emitOrderStatusUpdate: jest.fn(),
}));

const { AppError, asyncHandler, errorHandler } = require("../middleware/error");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

const buildTestApp = () => {
  const app = express();
  app.use(express.json());
  app.set("io", {});

  app.get("/api/menu", productController.getProducts);
  app.get("/api/menu/:id", productController.getProduct);
  app.post(
    "/api/orders",
    (req, res, next) => {
      req.user = { id: "user123", role: "customer" };
      next();
    },
    orderController.createOrder
  );

  app.put(
    "/api/orders/:id/payment",
    asyncHandler(async (req, res, next) => {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return next(new AppError("Order not found.", 404));
      }

      const { paymentMethod } = req.body;
      const acceptedMethods = ["Cash on Delivery", "UPI"];
      if (!paymentMethod || !acceptedMethods.includes(paymentMethod)) {
        return next(new AppError("Invalid payment method.", 400));
      }

      order.paymentMethod = paymentMethod;
      order.paymentStatus = "paid";
      await order.save();

      res.status(200).json({
        success: true,
        order,
      });
    })
  );

  app.patch(
    "/api/orders/:id/status",
    (req, res, next) => {
      req.user = { id: "user123", role: "admin" };
      next();
    },
    orderController.updateOrderStatus
  );

  app.use(errorHandler);
  return app;
};

describe("Food Delivery Backend Unit Tests", () => {
  let app;

  beforeAll(() => {
    app = buildTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Food Menu Items (GET /api/menu)", () => {
    it("retrieves the full list of available food items and returns 200", async () => {
      const menuItems = [
        {
          _id: "product1",
          title: "Spicy Chicken Burger",
          description: "Grilled chicken burger with signature sauce.",
          price: 11.99,
          category: { _id: "cat1", name: "Burgers" },
        },
      ];
      const populateMock = jest.fn().mockResolvedValue(menuItems);
      Product.find.mockReturnValue({ populate: populateMock });

      const response = await request(app).get("/api/menu");

      expect(Product.find).toHaveBeenCalledWith({});
      expect(populateMock).toHaveBeenCalledWith("category");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        results: menuItems.length,
        products: menuItems,
      });
    });

    it("fetches a single food item by ID and returns 200", async () => {
      const menuItem = {
        _id: "product2",
        title: "Paneer Tikka Pizza",
        description: "Crispy pizza topped with paneer tikka.",
        price: 13.5,
        category: { _id: "cat2", name: "Pizza" },
      };
      const populateMock = jest.fn().mockResolvedValue(menuItem);
      Product.findById.mockReturnValue({ populate: populateMock });

      const response = await request(app).get("/api/menu/product2");

      expect(Product.findById).toHaveBeenCalledWith("product2");
      expect(populateMock).toHaveBeenCalledWith("category");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        product: menuItem,
      });
    });

    it("returns 404 when a food item ID does not exist", async () => {
      const populateMock = jest.fn().mockResolvedValue(null);
      Product.findById.mockReturnValue({ populate: populateMock });

      const response = await request(app).get("/api/menu/notfound");

      expect(Product.findById).toHaveBeenCalledWith("notfound");
      expect(populateMock).toHaveBeenCalledWith("category");
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        status: "fail",
        message: "Product not found.",
      });
    });
  });

  describe("Order Placement & Cart Processing (POST /api/orders)", () => {
    it("creates an order successfully with valid cart items, address, and payment choice", async () => {
      const cart = {
        user: "user123",
        items: [
          {
            product: "product1",
            name: "Loaded Fries",
            quantity: 2,
            price: 5.5,
          },
        ],
      };
      const createdOrder = {
        _id: "order123",
        user: "user123",
        items: cart.items,
        shippingAddress: "101 Main Street, Apt 5",
        paymentMethod: "Cash on Delivery",
        itemsPrice: 11,
        deliveryFee: 5,
        totalPrice: 16,
        status: "pending",
      };

      Cart.findOne.mockResolvedValue(cart);
      Order.create.mockResolvedValue(createdOrder);
      Cart.findOneAndDelete.mockResolvedValue(cart);

      const response = await request(app)
        .post("/api/orders")
        .send({
          shippingAddress: "101 Main Street, Apt 5",
          paymentMethod: "Cash on Delivery",
        });

      expect(Cart.findOne).toHaveBeenCalledWith({ user: "user123" });
      expect(Order.create).toHaveBeenCalledWith({
        user: "user123",
        items: cart.items,
        shippingAddress: "101 Main Street, Apt 5",
        paymentMethod: "Cash on Delivery",
        itemsPrice: 11,
        deliveryFee: 5,
        totalPrice: 16,
        status: "pending",
      });
      expect(Cart.findOneAndDelete).toHaveBeenCalledWith({ user: "user123" });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        order: createdOrder,
      });
    });

    it("rejects order placement with 400 if the cart array is empty", async () => {
      Cart.findOne.mockResolvedValue({ user: "user123", items: [] });

      const response = await request(app)
        .post("/api/orders")
        .send({
          shippingAddress: "101 Main Street, Apt 5",
          paymentMethod: "Cash on Delivery",
        });

      expect(Cart.findOne).toHaveBeenCalledWith({ user: "user123" });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        status: "fail",
        message: "Your cart is empty.",
      });
    });

    it("fails with 400 when required delivery address fields are missing", async () => {
      const cart = {
        user: "user123",
        items: [
          {
            product: "product1",
            name: "Loaded Fries",
            quantity: 2,
            price: 5.5,
          },
        ],
      };

      Cart.findOne.mockResolvedValue(cart);

      const response = await request(app).post("/api/orders").send({});

      expect(Cart.findOne).toHaveBeenCalledWith({ user: "user123" });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        status: "fail",
        message: "Shipping address and payment method are required.",
      });
    });
  });

  describe("Payment Status Processing (PUT /api/orders/:id/payment)", () => {
    it("updates payment status successfully for Cash on Delivery", async () => {
      const existingOrder = {
        _id: "order789",
        paymentMethod: "Wallet",
        save: jest.fn().mockResolvedValue(true),
      };

      Order.findById.mockResolvedValue(existingOrder);

      const response = await request(app)
        .put("/api/orders/order789/payment")
        .send({ paymentMethod: "Cash on Delivery" });

      expect(Order.findById).toHaveBeenCalledWith("order789");
      expect(existingOrder.paymentMethod).toBe("Cash on Delivery");
      expect(existingOrder.paymentStatus).toBe("paid");
      expect(existingOrder.save).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        order: expect.objectContaining({
          _id: "order789",
          paymentMethod: "Cash on Delivery",
          paymentStatus: "paid",
        }),
      });
    });

    it("updates payment status successfully for UPI", async () => {
      const existingOrder = {
        _id: "order790",
        paymentMethod: "Cash on Delivery",
        save: jest.fn().mockResolvedValue(true),
      };

      Order.findById.mockResolvedValue(existingOrder);

      const response = await request(app)
        .put("/api/orders/order790/payment")
        .send({ paymentMethod: "UPI" });

      expect(Order.findById).toHaveBeenCalledWith("order790");
      expect(existingOrder.paymentMethod).toBe("UPI");
      expect(existingOrder.paymentStatus).toBe("paid");
      expect(existingOrder.save).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        order: expect.objectContaining({
          _id: "order790",
          paymentMethod: "UPI",
          paymentStatus: "paid",
        }),
      });
    });

    it("returns 404 when updating payment for a non-existent order ID", async () => {
      Order.findById.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/orders/missing/payment")
        .send({ paymentMethod: "UPI" });

      expect(Order.findById).toHaveBeenCalledWith("missing");
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        status: "fail",
        message: "Order not found.",
      });
    });
  });

  describe("Order Tracking Updates (PATCH /api/orders/:id/status)", () => {
    it("modifies the order status through the delivery pipeline and returns 200", async () => {
      const existingOrder = {
        _id: "order555",
        status: "pending",
        save: jest.fn().mockResolvedValue(true),
      };

      Order.findById.mockResolvedValue(existingOrder);

      const response = await request(app)
        .patch("/api/orders/order555/status")
        .send({ status: "out_for_delivery" });

      expect(Order.findById).toHaveBeenCalledWith("order555");
      expect(existingOrder.status).toBe("out_for_delivery");
      expect(existingOrder.save).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        order: expect.objectContaining({
          _id: "order555",
          status: "out_for_delivery",
        }),
      });
    });

    it("rejects invalid order status strings with 400", async () => {
      const existingOrder = {
        _id: "order556",
        status: "pending",
        save: jest.fn().mockResolvedValue(true),
      };

      Order.findById.mockResolvedValue(existingOrder);

      const response = await request(app)
        .patch("/api/orders/order556/status")
        .send({ status: "delivered early" });

      expect(Order.findById).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        status: "fail",
        message: "Invalid order status.",
      });
    });
  });
});
