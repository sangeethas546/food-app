const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../controllers/authController");
const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

router.use(protect);
router.route("/").get(getMyOrders).post(createOrder);
router.route("/:id").get(getOrder).patch(restrictTo("admin", "driver"), updateOrderStatus);

module.exports = router;
