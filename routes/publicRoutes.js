const publicController = require("../controllers/publicController");
const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const { validate } = require("../middlewares/validateMiddleware");

const router = express.Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
  message: "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Public Routes
router.post(
  "/login", 
  loginRateLimiter, 
  [
    body('identifier').isString().trim().notEmpty().escape().withMessage('Valid identifier required'),
    body('password').isString().notEmpty().withMessage('Password must be provided') // Do not escape passwords
  ],
  validate, // Automatically enforces strict whitelisting of the fields above!
  publicController.login
);

router.post(
  "/refresh-token", 
  [
    body('refreshToken').isString().trim().notEmpty().withMessage('Refresh token required')
  ],
  validate,
  publicController.refreshToken
);

router.post(
  "/logout", 
  [
    body('refreshToken').isString().trim().notEmpty().withMessage('Refresh token required')
  ],
  validate,
  publicController.logout
);

module.exports = router;
