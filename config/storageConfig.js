const AWS = require("aws-sdk");

const s3 = new AWS.S3({
    endpoint: "http://127.0.0.1:9000",
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin",
    s3ForcePathStyle: true,
    signatureVersion: "v4",
});

const BUCKET_NAME = "my-bucket";

module.exports = { s3, BUCKET_NAME };