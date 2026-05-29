const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../controllers/authController");
const { getMe, updateMe, getAllUsers } = require("../controllers/userController");

router.use(protect);
router.get("/me", getMe);
router.patch("/me", updateMe);
router.get("/", restrictTo("admin"), getAllUsers);

module.exports = router;
