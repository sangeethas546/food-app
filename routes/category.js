const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../controllers/authController");
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.route("/")
  .get(getCategories)
  .post(protect, restrictTo("admin"), createCategory);

router.route("/:id")
  .patch(protect, restrictTo("admin"), updateCategory)
  .delete(protect, restrictTo("admin"), deleteCategory);

module.exports = router;
