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
const uploadWithErrorHandler = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // File size error
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum allowed size is 10MB.",
          });
        }

        // Any Multer error
        return res.status(400).json({
          success: false,
          message: "Upload error: " + err.message,
        });
      } else if (err) {
        return res.status(500).json({
          success: false,
          message: "Unknown upload error",
        });
      }

      next(); // No errors → continue to controller
    });
  };
};

module.exports = { upload, nUpload, uploadWithErrorHandler };
