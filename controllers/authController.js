const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/User");
const { AppError, asyncHandler } = require("../middleware/error");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("Name, email and password are required.", 400));
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return next(new AppError("Email already registered.", 409));
  }

  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return next(new AppError("Phone number already registered.", 409));
    }
  }

  const user = await User.create({ name, email, password, phone, address });
  createSendToken(user, 201, res);
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required.", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("No user found with that email.", 404));
  }

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect password.", 401));
  }

  createSendToken(user, 200, res);
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, password, confirmPassword, phone } = req.body;

  if (!email || !password || !confirmPassword) {
    return next(new AppError("Email and new password are required.", 400));
  }

  if (password !== confirmPassword) {
    return next(new AppError("New password and confirmation do not match.", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("Email not found.", 404));
  }

  if (user.phone) {
    if (!phone) {
      return next(new AppError("Phone number is required to reset this account.", 400));
    }
    if (phone !== user.phone) {
      return next(new AppError("Phone number does not match our records.", 401));
    }
  }

  user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful.",
  });
});

exports.logout = asyncHandler(async (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("You are not logged in.", 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError("The user belonging to this token no longer exists.", 401));
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError("You do not have permission to perform this action.", 403));
  }
  next();
};
