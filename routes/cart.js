const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authController");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

router.use(protect);
router.get("/", getCart);
router.post("/", addToCart);
router.patch("/", updateCartItem);
router.delete("/item", removeFromCart);
router.delete("/", clearCart);

module.exports = router;
