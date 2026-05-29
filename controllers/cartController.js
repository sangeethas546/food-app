const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { AppError, asyncHandler } = require("../middleware/error");

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
  res.status(200).json({
    success: true,
    cart: cart || { items: [] },
  });
});

exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId || quantity < 1) {
    return next(new AppError("productId and quantity are required.", 400));
  }

  const product = await Product.findById(productId);
  if (!product || product.isAvailable === false) {
    return next(new AppError("Product not available.", 404));
  }

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  const itemIndex = cart.items.findIndex((item) => item.product.equals(product._id));
  if (itemIndex >= 0) {
    cart.items[itemIndex].quantity += quantity;
    cart.items[itemIndex].price = product.price;
  } else {
    cart.items.push({
      product: product._id,
      name: product.title,
      quantity,
      price: product.price,
    });
  }

  await cart.save();
  await cart.populate("items.product");

  res.status(200).json({
    success: true,
    cart,
  });
});

exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    return next(new AppError("productId and quantity are required.", 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError("Cart not found.", 404));
  }

  const itemIndex = cart.items.findIndex((item) => item.product.equals(productId));
  if (itemIndex < 0) {
    return next(new AppError("Product not found in cart.", 404));
  }

  if (quantity < 1) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  await cart.save();
  await cart.populate("items.product");

  res.status(200).json({
    success: true,
    cart,
  });
});

exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  if (!productId) {
    return next(new AppError("productId is required.", 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError("Cart not found.", 404));
  }

  cart.items = cart.items.filter((item) => !item.product.equals(productId));
  await cart.save();
  await cart.populate("items.product");

  res.status(200).json({
    success: true,
    cart,
  });
});

exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user.id });
  res.status(200).json({
    success: true,
    message: "Cart cleared.",
  });
});
