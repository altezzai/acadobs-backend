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

module.exports = { compressAndSaveFile };
