#!/usr/bin/env node
// Patches .prisma/client/default.js to bypass #main-entry-point
// which Next.js require-hook cannot resolve.
const fs = require("fs");
const path = require("path");

const file = path.resolve(__dirname, "../node_modules/.prisma/client/default.js");
const patched = `/* patched: bypass #main-entry-point for Next.js compatibility */\nmodule.exports = { ...require('./index.js') }\n`;

if (fs.existsSync(file)) {
  fs.writeFileSync(file, patched);
  console.log("✓ Patched .prisma/client/default.js");
}
