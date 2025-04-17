const multer = require("multer");
const path = require("path");
const fs = require("fs");

const mStorage = multer.memoryStorage();
const dpUpload = multer({
  storage: mStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const nStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "file") {
      cb(null, "uploads/news_files/");
    } else if (file.fieldname === "images") {
      cb(null, "uploads/news_images/");
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

const nUpload = multer({
  storage: mStorage,
  fileFilter,
});

module.exports = { dpUpload, nUpload };
