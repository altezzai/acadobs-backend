const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.memoryStorage(); // Use memory for compression
const dpUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = { dpUpload };
