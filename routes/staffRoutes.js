const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const { dpUpload } = require("../middlewares/upload");
// Internal Exam
router.post("/internalExams", staffController.createExamWithMarks);
router.get("/internalExams", staffController.getAllExams);
router.put("/internalExams/:id", staffController.updateExam);
router.delete("/internalExams/:id", staffController.deleteExam);
router.put("/updateMark/:mark_id", staffController.updateMark);
// Homework
router.post(
  "/homeworks",
  dpUpload.single("file"),
  staffController.createHomeworkWithAssignments
);
router.get("/homeworks", staffController.getAllHomework);
router.get("/homeworks/:id", staffController.getHomeworkById);
router.put(
  "/homeworks/:id",
  dpUpload.single("file"),
  staffController.updateHomework
);
router.delete("/homeworks/:id", staffController.deleteHomework);
router.patch("/homeworks/:id", staffController.restoreHomework);
router.delete(
  "/permentDeleteHomework/:id",
  staffController.permentDeleteHomework
);
router.put(
  "/updateHomeworkAssignment/:id",
  dpUpload.single("file"),
  staffController.updateHomeworkAssignment
);
router.put(
  "/bulkUpdateHomeworkAssignments/",
  staffController.bulkUpdateHomeworkAssignments
);
router.get(
  "/getHomeworkAssignmentById/:id",
  staffController.getHomeworkAssignmentById
);
router.get("/getHomeworkByTeacher/", staffController.getHomeworkByTeacher);
// Attendance
router.post("/attendance", staffController.createAttendance);
router.get("/attendance", staffController.getAllAttendance);
router.put("/attendance/:id", staffController.updateAttendance);
router.get("/getAttendanceById/:id", staffController.getAttendanceById);
router.get("/getAttendanceByTeacher/", staffController.getAttendanceByTeacher);
router.delete("/attendance/:id", staffController.deleteAttendance);
router.patch("/attendance/:id", staffController.restoreAttendance);
router.delete(
  "/permentDeleteAttendance/:id",
  staffController.permentDeleteAttendance
);

module.exports = router;
