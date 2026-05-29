const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { emitOrderStatusUpdate } = require("../orderTracking");
const { AppError, asyncHandler } = require("../middleware/error");

exports.createOrder = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || cart.items.length === 0) {
    return next(new AppError("Your cart is empty.", 400));
  }

  const { shippingAddress, paymentMethod } = req.body;
  if (!shippingAddress || !paymentMethod) {
    return next(new AppError("Shipping address and payment method are required.", 400));
  }

  const itemsPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 5;
  const totalPrice = itemsPrice + deliveryFee;

  const order = await Order.create({
    user: req.user.id,
    items: cart.items,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    deliveryFee,
    totalPrice,
    status: "pending",
  });

  await Cart.findOneAndDelete({ user: req.user.id });
  emitOrderStatusUpdate(req.app.get("io"), order._id.toString(), order.status);

  res.status(201).json({
    success: true,
    order,
  });
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate("items.product");
  res.status(200).json({
    success: true,
    results: orders.length,
    orders,
  });
});

exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("items.product user driver");
  if (!order) {
    return next(new AppError("Order not found.", 404));
  }

  if (req.user.role !== "admin" && !order.user.equals(req.user.id) && !order.driver?.equals(req.user.id)) {
    return next(new AppError("You are not allowed to view this order.", 403));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  if (!status) {
    return next(new AppError("Status is required." , 400));
  }

  const allowedStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    return next(new AppError("Invalid order status.", 400));
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError("Order not found.", 404));
  }

  order.status = status;
  if (status === "delivered") {
    order.deliveredAt = Date.now();
  }
  await order.save();

  emitOrderStatusUpdate(req.app.get("io"), order._id.toString(), order.status);

  res.status(200).json({
    success: true,
    order,
  });
});
