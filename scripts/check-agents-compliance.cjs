const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function mustExist(relativePath, message) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) {
    console.error(message);
    process.exit(1);
  }
}

function mustNotExist(relativePath, message) {
  const full = path.join(root, relativePath);
  if (fs.existsSync(full)) {
    console.error(message);
    process.exit(1);
  }
}

mustExist("AGENTS.md", "AGENTS.md is required at the repository root.");
mustNotExist(
  "AGENT_ROLES.md",
  "AGENT_ROLES.md must not exist; use AGENTS.md as the canonical agent guide."
);
mustExist(
  "docs/operations/task-tracker.md",
  "docs/operations/task-tracker.md is required for execution tracking."
);
mustExist(
  "docs/operations/logbook.md",
  "docs/operations/logbook.md is required for operational logging."
);

console.log("AGENTS compliance checks passed.");
