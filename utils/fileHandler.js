const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const compressAndSaveFile = async (file, uploadPath) => {
  try {
    const date = Date.now() + "-";
    let processedFileName = `${date}${file.originalname}`;
    let processedFile = file.buffer;

    const ext = path.extname(file.originalname).toLowerCase();

    if (file.mimetype.startsWith("image")) {
      // Compress image
      processedFileName = `${date}${file.originalname.split(".")[0]}.jpg`;
      processedFile = await sharp(file.buffer).jpeg({ quality: 30 }).toBuffer();
    }

    const filePath = path.join(uploadPath, processedFileName);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    fs.writeFileSync(filePath, processedFile);

    return processedFileName;
  } catch (error) {
    console.error("Error processing file:", error);
    throw new Error("Error processing file");
  }
};
const compressAndSaveMultiFile = async (file, uploadPath) => {
  const ext = path.extname(file.originalname);
  const fileName = `${Date.now()}_${file.originalname}`;
  const fullPath = path.join(uploadPath, fileName);

  // Ensure upload folder exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  // Check for image type
  if (file.mimetype.startsWith("image/")) {
    await sharp(file.buffer)
      .resize({ width: 800 }) // optional
      .jpeg({ quality: 80 })
      .toFile(fullPath);
  } else {
    // Just save non-image files as is
    fs.writeFileSync(fullPath, file.buffer);
  }

  return fileName;
};
const deletefilewithfoldername = async (filename, foldername) => {
  try {
    if (filename) {
      const filePath = path.join(foldername, filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log("Deleted file:", filePath);
      }
    }
  } catch (err) {
    console.error("Error cleaning up " + foldername + " files:", err);
  }
};

module.exports = {
  compressAndSaveFile,
  compressAndSaveMultiFile,
  deletefilewithfoldername,
};
