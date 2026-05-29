const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../controllers/authController");
const { getAdminDashboard } = require("../controllers/adminController");

router.use(protect, restrictTo("admin"));
router.get("/dashboard", getAdminDashboard);

module.exports = router;
