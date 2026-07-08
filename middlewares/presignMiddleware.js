const { s3, BUCKET_NAME } = require("../config/storageConfig");

const isFilePath = (str) => {
    if (!str || typeof str !== "string") return false;
    // if (str.includes(" ") || !str.includes("/")) return false;
    if (!str.includes("/")) return false;//newly added
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    if (uuidRegex.test(str)) return true;
    const knownFolders = [
        "staffs",
        "guardians",
        "students",
        "events",
        "leaverequests",
        "news",
        "notices",
        "drivers",
        "vehicles",
        "uploads"
    ];
    // const firstPart = str.split("/")[0];
    // if (knownFolders.includes(firstPart)) return true;
    const firstPart = str.replace(/^\/+/, "").split("/")[0];//newly added
    return knownFolders.includes(firstPart);// newly added

    // return false;
};

const toSignedUrl = (fileUrl) => {
    console.log("S3 Endpoint:", s3.config.endpoint);
    console.log("Bucket:", BUCKET_NAME);
    console.log("Incoming:", fileUrl);
    if (!fileUrl || typeof fileUrl !== "string") return fileUrl;
    if (fileUrl.includes("X-Amz-Algorithm")) return fileUrl;

    try {
        const endpointHost = s3.config?.endpoint?.host || "127.0.0.1:9000";
        const isS3Url = fileUrl.includes(endpointHost) ||
            fileUrl.includes("127.0.0.1:9000") ||
            fileUrl.includes("localhost:9000");

        if (!isS3Url) {
            if (isFilePath(fileUrl)) {
                console.log("Signing:", fileUrl);
                return s3.getSignedUrl("getObject", {
                    Bucket: BUCKET_NAME,
                    Key: fileUrl,
                    Expires: 60 * 60,
                });
            }
            console.log("Skipped:", fileUrl);
            return fileUrl;
        }

        const parsedUrl = new URL(fileUrl);
        const pathname = parsedUrl.pathname;
        const parts = pathname.split("/").filter(Boolean);

        if (parts.length < 2) return fileUrl;

        const bucket = parts.shift();
        const key = parts.join("/");

        return s3.getSignedUrl("getObject", {
            Bucket: bucket || BUCKET_NAME,
            Key: key,
            Expires: 60 * 60,
        });
    } catch (err) {
        console.error("Presign Error:", err);
        console.error("File:", fileUrl);
        return fileUrl;
    }
};
const transformResponse = (data) => {
    if (!data) return data;
    if (typeof data.toJSON === "function") {
        data = data.toJSON();
    }
    if (Array.isArray(data)) {
        return data.map(transformResponse);
    }
    if (typeof data === "object") {
        if (data instanceof Date || data instanceof RegExp) {
            return data;
        }

        const newObj = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];

                if (typeof value === "string") {
                    newObj[key] = toSignedUrl(value);
                } else {
                    newObj[key] = transformResponse(value);
                }
            }
        }
        return newObj;
    }

    return data;
};
const presignMiddleware = (req, res, next) => {
    const oldJson = res.json;

    res.json = function (data) {
        const modified = transformResponse(data);
        return oldJson.call(this, modified);
    };

    next();
};
module.exports = presignMiddleware;