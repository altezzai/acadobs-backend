const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const commonController = require("../controllers/commonController");
const { dpUpload } = require("../middlewares/upload");
// Internal Exam
router.post("/internalmarks", staffController.createExamWithMarks);
router.get("/internalmarks", staffController.getAllmarks);
router.get("/internalmarks/:id", staffController.getInternalMarksById);
router.put("/internalmarks/:id", staffController.updateExam);
router.delete("/internalmarks/:id", staffController.deleteExam);
router.put("/updateMark/:mark_id", staffController.updateMark);
router.put("/bulkUpdateMarks", staffController.bulkUpdateMarks);

router.get(
  "/getInternalMarkByRecordedBy",
  staffController.getInternalMarkByRecordedBy
);
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
router.get("/attendance/:id", staffController.getAttendanceById);
router.get(
  "/getTrashedAttendanceByTeacher/",
  staffController.getTrashedAttendanceByTeacher
);
router.get("/getAttendanceByTeacher/", staffController.getAttendanceByTeacher);
router.delete("/attendance/:id", staffController.deleteAttendance);
router.patch("/attendance/:id", staffController.restoreAttendance);
router.put(
  "updateAttendanceMarkedById/:id",
  staffController.updateAttendanceMarkedById
);
router.delete(
  "/permanentDeleteAttendance/:id",
  staffController.permanentDeleteAttendance
);
router.put(
  "/bulkUpdateAttendanceById/:attendance_id",
  staffController.bulkUpdateAttendanceById
);
router.get(
  "/getAttendanceByclassIdAndDate",
  staffController.getAttendanceByclassIdAndDate
);
router.get(
  "/getAllClassesAttendanceStatus",
  staffController.getAllClassesAttendanceStatus
);
//duty
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
// router.post(
//   "/createStudentLeaveRequest",
//   dpUpload.single("attachment"),
//   staffController.createStudentLeaveRequest
// );
router.patch(
  "/leaveRequestpermission/:id",
  staffController.leaveRequestPermission
);
router.get("/getLatestEvents", staffController.getLatestEvents);
router.get("/getLatestNews", staffController.getLatestNews);
router.get("/getLatestNotices", staffController.getLatestNotices);
//common Controller

router.get(
  "/getStudentsByClassId/:class_id",
  commonController.getStudentsByClassId
);

module.exports = router;
