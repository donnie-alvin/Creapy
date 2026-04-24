const bcrypt = require("bcryptjs");

function comparePassword(candidate, hashed) {
  return bcrypt.compare(candidate, hashed);
}

module.exports = { comparePassword };
