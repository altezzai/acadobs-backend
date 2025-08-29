const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const commonController = require("../controllers/commonController");
const { upload } = require("../middlewares/upload");
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
  upload.single("file"),
  staffController.createHomeworkWithAssignments
);
router.get("/homeworks", staffController.getAllHomework);
router.get("/homeworks/:id", staffController.getHomeworkById);
router.put(
  "/homeworks/:id",
  upload.single("file"),
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
  upload.single("file"),
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
  upload.single("solved_file"),
  staffController.updateAssignedDuty
);

router.post(
  "/achievements",
  upload.any(),
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
  upload.single("proof_document"),
  staffController.updateStudentAchievement
);
//Leave Request
router.post(
  "/leaveRequest",
  upload.single("attachment"),
  staffController.createLeaveRequest
);
router.get("/leaveRequest", staffController.getAllLeaveRequests);
router.get("/leaveRequest/:id", staffController.getLeaveRequestById);
router.put(
  "/leaveRequest/:id",
  upload.single("attachment"),
  staffController.updateLeaveRequest
);
router.delete("/leaveRequest/:id", staffController.deleteLeaveRequest);
router.patch("/leaveRequest/:id", staffController.restoreLeaveRequest);
router.patch(
  "/leaveRequestpermission/:id",
  staffController.leaveRequestPermission
);
router.post(
  "/parentNotes",
  upload.single("note_attachment"),
  staffController.createParentNote
);
router.get("/parentNotes", staffController.getAllOwnCreatedParentNotes);
router.get("/parentNotes/:id", staffController.getParentNoteById);
router.put(
  "/parentNotes/:id",
  upload.single("note_attachment"),
  staffController.updateParentNote
);
router.delete("/parentNotes/:id", staffController.deleteParentNote);

router.get("/getLatestEvents", staffController.getLatestEvents);
router.get("/getLatestNews", staffController.getLatestNews);
router.get("/getLatestNotices", staffController.getLatestNotices);
//common Controller

router.get(
  "/getStudentsByClassId/:class_id",
  commonController.getStudentsByClassId
);
router.get("/getClassesByYear/:year", commonController.getClassesByYear);
//common controller for student
router.get("/students/:id", commonController.getStudentById);
router.get(
  "/getHomeworkByStudentId/:student_id",
  commonController.getHomeworkByStudentId
);
router.get(
  "/getAttendanceByStudentId/:student_id",
  commonController.getAttendanceByStudentId
);
router.get(
  "/getStudentAttendanceByDate/:student_id",
  commonController.getStudentAttendanceByDate
);
router.get("/allAchievements", commonController.allAchievements);
router.get(
  "/achievementByStudentId/:student_id",
  commonController.achievementByStudentId
);
router.get(
  "/getInternalMarkByStudentId/:student_id",
  commonController.getInternalMarkByStudentId
);
router.get(
  "/getLeaveRequestByStudentId/:student_id",
  commonController.getLeaveRequestByStudentId
);
module.exports = router;
