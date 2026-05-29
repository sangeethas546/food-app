const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/error");

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

exports.updateMe = asyncHandler(async (req, res, next) => {
  const allowedFields = ["name", "phone", "address"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError("Please provide fields to update.", 400));
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});
