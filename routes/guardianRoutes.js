const express = require("express");
const router = express.Router();
const guardianController = require("../controllers/guardianController");
const commonController = require("../controllers/commonController");
const { upload } = require("../middlewares/upload");
router.put(
  "/updateHomeworkAssignment/:id",
  upload.single("file"),
  guardianController.updateHomeworkAssignment
);

router.get(
  "/getNoticeByStudentId/:student_id",
  guardianController.getNoticeByStudentId
);
router.get(
  "/getPaymentByStudentId/:student_id",
  guardianController.getPaymentByStudentId
);
router.get(
  "/getInvoiceByStudentId/:student_id",
  guardianController.getInvoiceByStudentId
);

router.post(
  "/leaveRequest",
  upload.single("attachment"),
  guardianController.createLeaveRequest
);
router.get("/leaveRequest", guardianController.getAllLeaveRequests);
router.get("/leaveRequest/:id", guardianController.getLeaveRequestById);

router.put(
  "/leaveRequest/:id",
  upload.single("attachment"),
  guardianController.updateLeaveRequest
);
router.delete("/leaveRequest/:id", guardianController.deleteLeaveRequest);

router.get("/getSchoolsByUser", guardianController.getSchoolsByUser);
router.get(
  "/getStudentsUnderGuardianBySchoolId/:school_id",
  guardianController.getStudentsUnderGuardianBySchoolId
);

router.get(
  "/getStaffsBySchoolId/:school_id",
  guardianController.getStaffsBySchoolId
);

router.get(
  "/getTodayTimetableByStudentId/:student_id",
  guardianController.getTodayTimetableByStudentId
);
router.get(
  "/getAllDayTimetableByStudentId/:student_id",
  guardianController.getAllDayTimetableByStudentId
);

router.get(
  "/getNavigationBarCounts",
  guardianController.getNavigationBarCounts
);

//common controller
router.get("/getLatestEvents", commonController.getLatestEvents);
router.get("/getLatestNews", commonController.getLatestNews);
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

router.put("/changePassword", commonController.changePassword);
router.put("/updateTcmToken", commonController.updateTcmToken);
module.exports = router;
