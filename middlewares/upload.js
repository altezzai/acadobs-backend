const multer = require("multer");
const path = require("path");
const fs = require("fs");

const mStorage = multer.memoryStorage();
const upload = multer({
  storage: mStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

const nUpload = multer({
  storage: mStorage,
  fileFilter,
});

module.exports = { upload, nUpload };
