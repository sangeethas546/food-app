const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../controllers/authController");
const { updateOrderStatus } = require("../controllers/orderController");

router.use(protect, restrictTo("driver"));
router.patch("/status/:id", updateOrderStatus);

module.exports = router;
