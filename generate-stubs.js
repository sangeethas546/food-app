/**
 * Route stubs — each file exports a real Express Router.
 * These prevent app.js from crashing during Step 1 initialisation.
 * They will be replaced file-by-file in subsequent build steps.
 *
 * Run this script once from the project root to
 * generate all eight stub files automatically:
 *
 *   node generate-stubs.js
 *
 * Or create them manually — the content is identical for each.
 */

const express = require("express");
const path = require("path");
const fs = require("fs");

const routes = [
  "auth",
  "user",
  "product",
  "category",
  "cart",
  "order",
  "delivery",
  "admin",
];

const stub = (name) => `const express = require("express");
const router = express.Router();

// Stub for /${name} routes.
// Replace this file in the corresponding build step.
router.all("*", (req, res) => {
  res.status(501).json({
    success: false,
    message: \`${name} routes not yet implemented.\`,
  });
});

module.exports = router;
`;

routes.forEach((name) => {
  const filePath = path.join(__dirname, "routes", `${name}.js`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, stub(name));
    console.log(`Created stub: routes/${name}.js`);
  } else {
    console.log(`Skipped (already exists): routes/${name}.js`);
  }
});
