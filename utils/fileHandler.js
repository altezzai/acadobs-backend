const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const jpeg = require("jpeg-js");

const repairJPEG = (buffer) => {
  try {
    const raw = jpeg.decode(buffer, {
      useTArray: true,
      tolerantDecoding: true,
    }); // tolerant decoding = auto repair
    const repaired = jpeg.encode(raw, 80); // re-encode as clean JPEG
    return repaired.data;
  } catch (err) {
    console.log("JPEG repair failed:", err.message);
    return buffer; // fallback to original
  }
};
const compressAndSaveFile = async (file, uploadPath) => {
  try {
    const date = Date.now() + "-";
    let processedFileName = `${date}${file.originalname}`;
    let processedFile = file.buffer;

    if (file.mimetype.startsWith("image")) {
      // 🔥 REPAIR BROKEN JPEG BEFORE SHARP
      if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
        processedFile = repairJPEG(file.buffer);
      }

      processedFileName = `${date}${file.originalname.split(".")[0]}.jpg`;

      // 🔥 SAFE CONVERSION TO PREVENT CRASH
      processedFile = await sharp(processedFile)
        .rotate()
        .ensureAlpha()
        .toFormat("jpeg", { quality: 30 })
        .toBuffer();
    }

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, processedFileName);
    fs.writeFileSync(filePath, processedFile);

    return processedFileName;
  } catch (error) {
    console.error("Error processing file:", error);
    throw new Error("Error processing file: " + error.message);
  }
};
const compressAndSaveMultiFile = async (file, uploadPath) => {
  const ext = path.extname(file.originalname);
  const fileName = `${Date.now()}_${file.originalname}`;
  let fullPath = path.join(uploadPath, fileName);

  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
    fullPath = repairJPEG(file.buffer);
  }

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
const compressImage = async (filePath, outputDir) => {
  const filename = path.basename(filePath);
  let compressedPath = path.join(outputDir, `compressed-${filename}`);
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
    compressedPath = repairJPEG(file.buffer);
  }

  await sharp(filePath)
    .resize({ width: 1080 }) // Resize width max to 1080px
    .jpeg({ quality: 70 }) // Compress quality
    .toFile(compressedPath);

  // fs.unlinkSync(filePath); // remove original uncompressed image

  return `compressed-${filename}`;
};
module.exports = {
  compressAndSaveFile,
  compressAndSaveMultiFile,
  deletefilewithfoldername,
  compressImage,
};
