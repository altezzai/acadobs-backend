const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");
const commonController = require("../controllers/commonController");
const { upload, uploadWithErrorHandler } = require("../middlewares/upload");
const { storageUploadMiddleware } = require("../middlewares/storageUploads");
// Internal Exam
router.post("/internalmarks", teacherController.createExamWithMarks);
router.get("/internalmarks", teacherController.getAllmarks);
router.get("/internalmarks/:id", teacherController.getInternalMarksById);
router.put("/internalmarks/:id", teacherController.updateExam);
router.delete("/internalmarks/:id", teacherController.deleteExam);
router.put("/updateMark/:mark_id", teacherController.updateMark);
router.put("/bulkUpdateMarks", teacherController.bulkUpdateMarks);

router.get("/getExams", teacherController.getExams);

router.get(
  "/getInternalMarkByRecordedBy",
  teacherController.getInternalMarkByRecordedBy,
);
router.get("/getExamMarkByRecordedBy", teacherController.getExamMarkByRecordedBy);
router.get(
  "/getTrashedInternalMarkByRecordedBy",
  teacherController.getTrashedInternalMarkByRecordedBy);
router.get(
  "/getTrashedExamMarkByRecordedBy",
  teacherController.getTrashedExamMarkByRecordedBy);
router.patch(
  "/restoreInternalMark/:id",
  teacherController.restoreInternalMark);
//my class exam mark
router.get("/getMyClassExamMark",teacherController.getMyClassExamMark);
router.get("/getMyClassInternalMark",teacherController.getMyClassInternalMark);

// Homework
router.post(
  "/homeworks",
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("homeworks"),
  teacherController.createHomeworkWithAssignments,
);
router.get("/homeworks", teacherController.getAllHomework);
router.get("/homeworks/:id", teacherController.getHomeworkById);
router.put(
  "/homeworks/:id",
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("homeworks"),
  teacherController.updateHomework,
);
router.delete("/homeworks/:id", teacherController.deleteHomework);
router.patch("/homeworks/:id", teacherController.restoreHomework);
router.delete(
  "/permanentDeleteHomework/:id",
  teacherController.permanentDeleteHomework,
);
router.put(
  "/updateHomeworkAssignment/:id",
  uploadWithErrorHandler(upload.single("file")),
  teacherController.updateHomeworkAssignment,
);
router.put(
  "/bulkUpdateHomeworkAssignments/",
  teacherController.bulkUpdateHomeworkAssignments,
);
router.get(
  "/getHomeworkAssignmentById/:id",
  teacherController.getHomeworkAssignmentById,
);
router.get("/getHomeworkByTeacher/", teacherController.getHomeworkByTeacher);
router.get("/getMyClassHomework", teacherController.getMyClassHomework);
// Attendance
router.post("/attendance", teacherController.createAttendance);
router.get("/attendance", teacherController.getAllAttendance);
router.put("/attendance/:id", teacherController.updateAttendance);
router.get("/attendance/:id", teacherController.getAttendanceById);
router.get(
  "/getTrashedAttendanceByTeacher/",
  teacherController.getTrashedAttendanceByTeacher,
);
router.get("/getAttendanceByTeacher/", teacherController.getAttendanceByTeacher);
router.delete("/attendance/:id", teacherController.deleteAttendance);
router.patch("/attendance/:id", teacherController.restoreAttendance);
router.put(
  "updateAttendanceMarkedById/:id",
  teacherController.updateAttendanceMarkedById,
);
router.delete(
  "/permanentDeleteAttendance/:id",
  teacherController.permanentDeleteAttendance,
);
router.put(
  "/bulkUpdateAttendanceById/:attendance_id",
  teacherController.bulkUpdateAttendanceById,
);
router.get(
  "/getAttendanceByclassIdAndDate",
  teacherController.getAttendanceByclassIdAndDate,
);
router.get(
  "/getAllClassesAttendanceStatus",
  teacherController.getAllClassesAttendanceStatus,
);
//duty
router.get("/duties", teacherController.getAllDuties);
router.get("/duties/:id", teacherController.getAssignedDutyById);

router.put(
  "/updateAssignedDuty/:id",
  uploadWithErrorHandler(upload.single("solved_file")),
  teacherController.updateAssignedDuty,
);

router.post(
  "/achievements",
  uploadWithErrorHandler(upload.any()),
  teacherController.createAchievementWithStudents,
);
router.get("/achievements", teacherController.getAllAchievementsByStaffId);
router.get("/achievements/:id", teacherController.getAchievementById);
router.put("/achievements/:id", teacherController.updateAchievement);
router.delete("/achievements/:id", teacherController.deleteAchievement);
router.patch("/achievements/:id", teacherController.restoreAchievement);
router.put(
  "/updateStudentAchievement/:id",
  uploadWithErrorHandler(upload.any()),
  teacherController.updateStudentAchievement,
);
//Leave Request
router.post(
  "/leaveRequest",
  uploadWithErrorHandler(upload.single("attachment")),
  storageUploadMiddleware("leave_requests"),
  teacherController.createLeaveRequest,
);
router.get("/leaveRequest", teacherController.getAllLeaveRequests);
router.get("/leaveRequest/:id", teacherController.getLeaveRequestById);
router.put(
  "/leaveRequest/:id",
  uploadWithErrorHandler(upload.single("attachment")),
  storageUploadMiddleware("leave_requests"),
  teacherController.updateLeaveRequest,
);
router.delete("/leaveRequest/:id", teacherController.deleteLeaveRequest);
router.patch("/leaveRequest/:id", teacherController.restoreLeaveRequest);
//student leave request for class teacher
router.get(
  "/getStudentLeaveRequestsForClassTeacher",
  teacherController.getStudentLeaveRequestsForClassTeacher,
);
router.patch(
  "/leaveRequestpermission/:id",
  teacherController.leaveRequestPermission,
);

//parent notes
router.post(
  "/parentNotes",
  uploadWithErrorHandler(upload.single("note_attachment")),
  teacherController.createParentNote,
);
router.get("/parentNotes", teacherController.getAllOwnCreatedParentNotes);
router.get("/parentNotes/:id", teacherController.getParentNoteById);
router.put(
  "/parentNotes/:id",
  uploadWithErrorHandler(upload.single("note_attachment")),
  teacherController.updateParentNote,
);
router.delete("/parentNotes/:id", teacherController.deleteParentNote);

//timetable
router.get(
  "/getTodayTimetableForStaff",
  teacherController.getTodayTimetableForStaff,
);
router.get(
  "/getAllDayTimetableForStaff",
  teacherController.getAllDaysTimetableForStaff,
);

router.get("/getNavigationBarCounts", teacherController.getNavigationBarCounts);
router.get("/getLatestNotices", teacherController.getLatestNotices);

router.post("/markSelfAttendance", teacherController.markSelfAttendance);
router.put(
  "/markCheckOutSelfAttendance",
  teacherController.markCheckOutSelfAttendance,
);
router.get("/todayAttendanceStatus", teacherController.todayAttendanceStatus);

router.put(
  "/updateProfileDetails",
  uploadWithErrorHandler(upload.single("dp")),
  storageUploadMiddleware("staffs"),
  teacherController.updateProfileDetails,
);
router.get("/getProfileDetails", teacherController.getProfileDetails);

router.get("/getSubjects", teacherController.getSubjects);
router.get("/getStaffSubjects", teacherController.getStaffSubjects);

router.get("/getMyPermissions", teacherController.getMyPermissions);

//common Controller
router.get("/getLatestEvents", commonController.getLatestEvents);
router.get("/getLatestNews", commonController.getLatestNews);

router.get(
  "/getStudentsByClassId/:class_id",
  commonController.getStudentsByClassId,
);
router.get(
  "/getStudentsBySpecialClassId/:class_id",
  commonController.getSpecialClassStudentsByClassId,
);
router.get("/getClassesByYear/:year", commonController.getClassesByYear);

//common controller for student
router.get("/students/:id", commonController.getStudentById);
router.get(
  "/getGuarduianIdbyStudentId",
  commonController.getGuarduianIdbyStudentId,
);
router.get(
  "/getHomeworkByStudentId/:student_id",
  commonController.getHomeworkByStudentId,
);
router.get(
  "/getAttendanceByStudentId/:student_id",
  commonController.getAttendanceByStudentId,
);
router.get(
  "/getStudentAttendanceByDate/:student_id",
  commonController.getStudentAttendanceByDate,
);
router.get("/allAchievements", commonController.allAchievements);
router.get(
  "/achievementByStudentId/:student_id",
  commonController.achievementByStudentId,
);
router.get(
  "/getInternalMarkByStudentId/:student_id",
  commonController.getInternalMarkByStudentId,
);
router.get(
  "/getLeaveRequestByStudentId/:student_id",
  commonController.getLeaveRequestByStudentId,
);
router.get("/getSchoolDetails", commonController.getSchoolDetails);

router.put("/changePassword", commonController.changePassword);
router.put(
  "/updateDp",
  uploadWithErrorHandler(upload.single("dp")),
  storageUploadMiddleware("profileDp"),
  commonController.updateDp,
);

router.get("/getPaymentById/:id", commonController.getPaymentById);
router.get(
  "/getAchievementsBySchool",
  commonController.getAchievementsBySchool,
);
module.exports = router;
