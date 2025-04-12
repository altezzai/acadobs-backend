const multer = require("multer");
const path = require("path");
const fs = require("fs");

const mStorage = multer.memoryStorage();
const dpUpload = multer({
  storage: mStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = { dpUpload };
