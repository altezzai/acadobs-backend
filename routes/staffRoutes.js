const express = require("express");
const router = express.Router();
const examController = require("../controllers/staffController");
const { dpUpload } = require("../middlewares/upload");

router.post("/internalExams", examController.createExamWithMarks);
router.get("/internalExams", examController.getAllExams);
router.get("/getAllmarks", examController.getAllmarks);
router.put("/internalExams/:id", examController.updateExam);
router.delete("/internalExams/:id", examController.deleteExam);
router.put("/updateMark/:mark_id", examController.updateMark);

router.post(
  "/homeworks",
  dpUpload.single("file"),
  examController.createHomeworkWithAssignments
);
router.get("/homeworks", examController.getAllHomework);
router.get("/homeworks/:id", examController.getHomeworkById);
router.put(
  "/homeworks/:id",
  dpUpload.single("file"),
  examController.updateHomework
);
router.delete("/homeworks/:id", examController.deleteHomework);
router.patch("/homeworks/:id", examController.restoreHomework);
router.delete(
  "/permentDeleteHomework/:id",
  examController.permentDeleteHomework
);
router.put(
  "/updateHomeworkAssignment/:id",
  dpUpload.single("file"),
  examController.updateHomeworkAssignment
);
router.put(
  "/bulkUpdateHomeworkAssignments/",
  examController.bulkUpdateHomeworkAssignments
);

module.exports = router;
