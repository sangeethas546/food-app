const Category = require("../models/Category");
const { AppError, asyncHandler } = require("../middleware/error");

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true });
  res.status(200).json({
    success: true,
    results: categories.length,
    categories,
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({
    success: true,
    category,
  });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return next(new AppError("Category not found.", 404));
  }

  res.status(200).json({
    success: true,
    category,
  });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    return next(new AppError("Category not found.", 404));
  }

  res.status(204).json({
    success: true,
    data: null,
  });
});
