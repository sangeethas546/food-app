const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { asyncHandler } = require("../middleware/error");

exports.getAdminDashboard = asyncHandler(async (req, res) => {
  const [orderCount, userCount, productCount, categoryCount, pendingOrders] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments(),
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments({ status: "pending" }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      orderCount,
      userCount,
      productCount,
      categoryCount,
      pendingOrders,
    },
  });
});
