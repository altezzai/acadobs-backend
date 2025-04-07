const express = require("express");
const router = express.Router();
const examController = require("../controllers/staffController");

router.post("/internalExams", examController.createExamWithMarks);
router.get("/internalExams", examController.getAllExams);
router.get("/getAllmarks", examController.getAllmarks);
router.put("/internalExams/:id", examController.updateExam);
router.delete("/internalExams/:id", examController.deleteExam);
router.put("/updateMark/:mark_id", examController.updateMark);

module.exports = router;
