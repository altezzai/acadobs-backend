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
router.get(
  "/getAttendanceByStudentId/:student_id",
  guardianController.getAttendanceByStudentId
);
router.get(
  "/getStudentAttendanceByDate/:student_id",
  guardianController.getStudentAttendanceByDate
);
router.get(
  "/allAchievementBySchoolId/:school_id",
  guardianController.allAchievementBySchoolId
);
router.get(
  "/achievementByStudentId/:student_id",
  guardianController.achievementByStudentId
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
  dpUpload.single("attachment"),
  guardianController.createLeaveRequest
);
router.get("/leaveRequest", guardianController.getAllLeaveRequests);
router.get("/leaveRequest/:id", guardianController.getLeaveRequestById);
router.get(
  "/leaveRequestByStudentId/:student_id",
  guardianController.getLeaveRequestByStudentId
);
router.put(
  "/leaveRequest/:id",
  dpUpload.single("attachment"),
  guardianController.updateLeaveRequest
);
router.delete("/leaveRequest/:id", guardianController.deleteLeaveRequest);
module.exports = router;
