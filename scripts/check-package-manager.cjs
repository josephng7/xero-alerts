const lockfileExists = require("node:fs").existsSync("pnpm-lock.yaml");
const npmLockExists = require("node:fs").existsSync("package-lock.json");

if (!lockfileExists) {
  console.error("pnpm-lock.yaml is required for reproducible installs.");
  process.exit(1);
}

if (npmLockExists) {
  console.error("package-lock.json detected. This project standardizes on pnpm only.");
  process.exit(1);
}

console.log("Package manager guard checks passed.");
