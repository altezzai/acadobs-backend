const express = require("express");
const router = express.Router();
const { dpUpload } = require("../middlewares/upload");
const superAdminController = require("../controllers/superAdminController");
const schoolAdminController = require("../controllers/schoolAdminController");

router.post(
  "/schools",
  dpUpload.single("logo"),
  superAdminController.createSchool
);
router.get("/schools", superAdminController.getAllSchools);
router.put(
  "/schools/:id",
  dpUpload.single("logo"),
  superAdminController.updateSchool
);
router.delete("/schools/:id", superAdminController.deleteSchool);

module.exports = router;
