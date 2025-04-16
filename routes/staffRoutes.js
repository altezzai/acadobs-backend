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
  "/permanentDeleteHomework/:id",
  staffController.permanentDeleteHomework
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
  "/permanentDeleteAttendance/:id",
  staffController.permanentDeleteAttendance
);
router.put(
  "/bulkUpdateMarkedAttendanceByAttendanceId/:id",
  staffController.bulkUpdateMarkedAttendanceByAttendanceId
);
router.get("/duties", staffController.getAllDuties);
router.get("/duties/:id", staffController.getAssignedDutyById);

router.put(
  "/updateAssignedDuty/:id",
  dpUpload.single("solved_file"),
  staffController.updateAssignedDuty
);

router.post(
  "/achievements",
  dpUpload.any(),
  staffController.createAchievementWithStudents
);
router.get(
  "/achievementsByStaffId/:id",
  staffController.getAllAchievementsByStaffId
);
router.get("/achievements/:id", staffController.getAchievementById);
router.put("/achievements/:id", staffController.updateAchievement);
router.delete("/achievements/:id", staffController.deleteAchievement);
router.patch("/achievements/:id", staffController.restoreAchievement);
router.put(
  "/updateStudentAchievement/:id",
  dpUpload.single("proof_document"),
  staffController.updateStudentAchievement
);
//Leave Request
router.post(
  "/leaveRequest",
  dpUpload.single("attachment"),
  staffController.createLeaveRequest
);
router.get("/leaveRequest", staffController.getAllLeaveRequests);
router.get("/leaveRequest/:id", staffController.getLeaveRequestById);
router.put(
  "/leaveRequest/:id",
  dpUpload.single("attachment"),
  staffController.updateLeaveRequest
);
router.delete("/leaveRequest/:id", staffController.deleteLeaveRequest);
router.patch("/leaveRequest/:id", staffController.restoreLeaveRequest);
router.post(
  "/createStudentLeaveRequest",
  dpUpload.single("attachment"),
  staffController.createStudentLeaveRequest
);
router.patch(
  "/leaveRequestpermission/:id",
  staffController.leaveRequestPermission
);

module.exports = router;
