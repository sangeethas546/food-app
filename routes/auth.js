const express = require("express");
const router = express.Router();
const { register, login, logout, resetPassword, protect } = require("../controllers/authController");
const { getMe } = require("../controllers/userController");

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.get("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
