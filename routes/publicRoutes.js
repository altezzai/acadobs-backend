const publicController = require("../controllers/publicController");
const express = require("express");
const router = express.Router();

// Public Routes
router.post("/login", publicController.login);

module.exports = router;
