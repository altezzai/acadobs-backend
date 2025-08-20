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

router.get("/getLatestEvents", guardianController.getLatestEvents);
router.get("/getLatestNews", guardianController.getLatestNews);

//common controller
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
