const Product = require("../models/Product");
const Category = require("../models/Category");
const { AppError, asyncHandler } = require("../middleware/error");

exports.getProducts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) {
    const categoryName = req.query.category.trim();
    const category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, "i") });
    filter.category = category ? category._id : req.query.category;
  }
  if (req.query.available) filter.isAvailable = req.query.available === "true";

  const products = await Product.find(filter).populate("category");

  res.status(200).json({
    success: true,
    results: products.length,
    products,
  });
});

exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) {
    return next(new AppError("Product not found.", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError("Product not found.", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return next(new AppError("Product not found.", 404));
  }

  res.status(204).json({
    success: true,
    data: null,
  });
});
