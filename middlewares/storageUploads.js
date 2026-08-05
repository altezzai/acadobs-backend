const { s3, BUCKET_NAME } = require("../config/storageConfig");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const path = require("path");

// upload single file
const uploadSingleFile = async (file, folder) => {
    const compressedBuffer = await compressImage(file);
    const isImage = file.mimetype.startsWith("image/");
    const baseName = isImage ? path.parse(file.originalname).name : file.originalname;
    const extension = isImage ? ".jpg" : path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}-${baseName}${extension}`;

    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: compressedBuffer,
        ContentType: isImage ? "image/jpeg" : file.mimetype,
    };

    const data = await s3.upload(params).promise();

    return {
        fileName,
        url: fileName,
    };
};

// upload multiple files (array OR fields)
const uploadMultipleFiles = async (files, folder = "uploads") => {
    const uploaded = {};

    if (typeof files === "object" && !Array.isArray(files)) {
        for (const field in files) {
            uploaded[field] = [];

            for (const file of files[field]) {
                const result = await uploadSingleFile(
                    file,
                    `${folder}/${field}`
                );
                uploaded[field].push(result);
            }
        }
    }
    if (Array.isArray(files)) {
        uploaded.files = [];

        for (const file of files) {
            const result = await uploadSingleFile(file, folder);
            uploaded.files.push(result);
        }
    }

    return uploaded;
};

//DELETE FILE FROM MINIO
const deleteFile = async (fileUrl) => {
    try {
        if (!fileUrl) return;
        const key = fileUrl.includes(`${BUCKET_NAME}/`) ? fileUrl.split(`${BUCKET_NAME}/`)[1] : fileUrl;
        if (!key) {
            console.error("Invalid file URL:", fileUrl);
            return;
        }
        await s3.deleteObject({
            Bucket: BUCKET_NAME,
            Key: key,
        }).promise();
    } catch (err) {
        console.error("MinIO delete error:", err);
    }
};

const compressImage = async (file) => {
    try {
        if (!file.mimetype.startsWith("image")) {
            return file.buffer;
        }

        const compressedBuffer = await sharp(file.buffer)
            .rotate()
            .resize({ width: 1200 })
            .jpeg({ quality: 70 })
            .toBuffer();

        return compressedBuffer;
    } catch (err) {
        console.error("Compression error:", err);
        return file.buffer;
    }
};

//  MAIN MIDDLEWARE
const storageUploadMiddleware = (folder = "uploads") => {
    return async (req, res, next) => {
        try {
            let uploaded = {};

            if (req.files) {
                uploaded = await uploadMultipleFiles(req.files, folder);
            }

            if (req.file) {
                const result = await uploadSingleFile(req.file, folder);
                uploaded[req.file.fieldname] = result;
            }

            req.uploadedFiles = uploaded;

            next();
        } catch (err) {
            console.error("MinIO Upload Error:", err);
            return res.status(500).json({ error: "File upload failed" });
        }
    };
};


// const storageUploadMiddleware = (folder = "uploads") => {
//     return async (req, res, next) => {
//         try {
//             let uploaded = {};

//             if (req.files) {
//                 for (const field in req.files) {
//                     uploaded[field] = [];

//                     for (const file of req.files[field]) {
//                         const result = await uploadSingleFile(
//                             file,
//                             `${folder}/${field}`
//                         );
//                         uploaded[field].push(result);
//                     }
//                 }
//             }

//             if (req.file) {
//                 const result = await uploadSingleFile(req.file, folder);
//                 uploaded[req.file.fieldname] = result;
//             }

//             //  attach to req
//             req.uploadedFiles = uploaded;

//             next();
//         } catch (err) {
//             console.error("MinIO Upload Error:", err);
//             return res.status(500).json({ error: "File upload failed" });
//         }
//     };
// };

module.exports = { storageUploadMiddleware, deleteFile, uploadMultipleFiles, compressImage };