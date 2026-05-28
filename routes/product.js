const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../controllers/authController");
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

router.route("/")
  .get(getProducts)
  .post(protect, restrictTo("admin"), createProduct);

router.route("/:id")
  .get(getProduct)
  .patch(protect, restrictTo("admin"), updateProduct)
  .delete(protect, restrictTo("admin"), deleteProduct);

module.exports = router;
