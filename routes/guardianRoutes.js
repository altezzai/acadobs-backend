const express = require("express");
const router = express.Router();
const guardianController = require("../controllers/guardianController");
const { dpUpload } = require("../middlewares/upload");
router.put(
  "/updateHomeworkAssignment/:id",
  dpUpload.single("file"),
  guardianController.updateHomeworkAssignment
);
router.get(
  "/getHomeworkByStudentId/:student_id",
  guardianController.getHomeworkByStudentId
);

module.exports = router;
