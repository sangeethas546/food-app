const express = require("express");
const router = express.Router();
const { register, login, logout, protect } = require("../controllers/authController");
const { getMe } = require("../controllers/userController");

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
