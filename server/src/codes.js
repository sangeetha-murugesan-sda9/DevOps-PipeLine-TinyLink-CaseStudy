const crypto = require("crypto");

// base64url so it's safe to use straight in a path segment
function generateCode(length = 7) {
  return crypto.randomBytes(8).toString("base64url").slice(0, length);
}

module.exports = { generateCode };