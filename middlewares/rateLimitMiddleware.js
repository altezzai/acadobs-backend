const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per window
  message: { error: "Too many requests, please try again later." },
  headers: true,
});

module.exports = limiter;
