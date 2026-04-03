const express = require("express");
const router = express.Router();
const guardianController = require("../controllers/guardianController");
const commonController = require("../controllers/commonController");
const { upload, uploadWithErrorHandler } = require("../middlewares/upload");
const { body } = require("express-validator");
const { validate } = require("../middlewares/validateMiddleware");
router.put(
  "/updateHomeworkAssignment/:id",
  uploadWithErrorHandler(upload.single("file")),
  [
    body('status').optional().customSanitizer(val => val === 'null' ? null : val).isString().trim().escape(),
    body('points').optional().isNumeric(),
    body('student_id').notEmpty().trim().escape()
  ],
  validate,
  guardianController.updateHomeworkAssignment,
);

router.get(
  "/getNoticeByStudentId/:student_id",
  guardianController.getNoticeByStudentId,
);
router.get(
  "/getPaymentByStudentId/:student_id",
  guardianController.getPaymentByStudentId,
);
router.get(
  "/getInvoiceByStudentId/:student_id",
  guardianController.getInvoiceByStudentId,
);

const leaveRequestValidation = [
  body('student_id').notEmpty().trim().escape(),
  body('from_date').notEmpty().trim().escape(),
  body('to_date').notEmpty().trim().escape(),
  body('leave_type').notEmpty().trim().escape(),
  body('reason').notEmpty().trim().escape(),
  body('leave_duration').optional().trim().escape(),
  body('half_section').optional().trim().escape()
];

router.post(
  "/leaveRequest",
  uploadWithErrorHandler(upload.single("attachment")),
  leaveRequestValidation,
  validate,
  guardianController.createLeaveRequest,
);
router.get("/leaveRequest", guardianController.getAllLeaveRequests);
router.get("/leaveRequest/:id", guardianController.getLeaveRequestById);

router.put(
  "/leaveRequest/:id",
  uploadWithErrorHandler(upload.single("attachment")),
  leaveRequestValidation,
  validate,
  guardianController.updateLeaveRequest,
);
router.delete("/leaveRequest/:id", guardianController.deleteLeaveRequest);

router.get("/getSchoolsByUser", guardianController.getSchoolsByUser);
router.get(
  "/getStudentsUnderGuardianBySchoolId/:school_id",
  guardianController.getStudentsUnderGuardianBySchoolId,
);

router.get(
  "/getStaffsBySchoolId/:school_id",
  guardianController.getStaffsBySchoolId,
);

router.get(
  "/getTodayTimetableByStudentId/:student_id",
  guardianController.getTodayTimetableByStudentId,
);
router.get(
  "/getAllDayTimetableByStudentId/:student_id",
  guardianController.getAllDayTimetableByStudentId,
);

router.get(
  "/getNavigationBarCounts",
  guardianController.getNavigationBarCounts,
);
router.put(
  "/updateStudentProfile/:student_id",
  uploadWithErrorHandler(upload.single("image")),
  [body('address').optional().isString().trim().escape()],
  validate,
  guardianController.updateStudentProfile,
);
router.put("/updateProfileDetails",
  [
    body('guardian_relation').optional().isString().trim().escape(),
    body('guardian_job').optional().isString().trim().escape(),
    body('guardian2_relation').optional().isString().trim().escape(),
    body('guardian2_name').optional().isString().trim().escape(),
    body('guardian2_job').optional().isString().trim().escape(),
    body('guardian2_contact').optional().isString().trim().escape(),
    body('father_name').optional().isString().trim().escape(),
    body('mother_name').optional().isString().trim().escape(),
    body('house_name').optional().isString().trim().escape(),
    body('street').optional().isString().trim().escape(),
    body('city').optional().isString().trim().escape(),
    body('landmark').optional().isString().trim().escape(),
    body('district').optional().isString().trim().escape(),
    body('state').optional().isString().trim().escape(),
    body('country').optional().isString().trim().escape(),
    body('post').optional().isString().trim().escape(),
    body('pincode').optional().isString().trim().escape()
  ],
  validate,
  guardianController.updateProfileDetails
);
router.put(
  "/changeIdentifiersAndName",
  [
    body('guardian_email').optional().isEmail().normalizeEmail(),
    body('guardian_name').optional().isString().trim().escape(),
    body('guardian_contact').optional().isString().trim().escape()
  ],
  validate,
  guardianController.changeIdentifiersAndName,
);
router.get("/getProfileDetails", guardianController.getProfileDetails);

router.get("/getHomeworkById/:id", guardianController.getHomeworkById);
router.get("/getAchievementById/:id", guardianController.getAchievementById);

//common controller
router.get("/getLatestEvents", commonController.getLatestEvents);
router.get("/getLatestNews", commonController.getLatestNews);
router.get("/students/:id", commonController.getStudentById);
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

router.put("/changePassword", 
  [
    body('oldPassword').notEmpty().isString(),
    body('newPassword').notEmpty().isString()
  ],
  validate,
  commonController.changePassword
);
router.put("/updateFcmToken", 
  [
    body('fcm_token').optional().isString().trim().escape()
  ],
  validate,
  commonController.updateFcmToken
);

router.put(
  "/updateDp",
  uploadWithErrorHandler(upload.single("dp")),
  [],
  validate,
  commonController.updateDp,
);

router.get("/getPaymentById/:id", commonController.getPaymentById);
router.get(
  "/getAchievementsBySchool",
  commonController.getAchievementsBySchool,
);

router.post("/accountDeleteRequests", 
  [
    body('reason').optional().isString().trim().escape()
  ],
  validate,
  commonController.accountDeleteRequests
);

router.get("/getSchoolDetails", commonController.getSchoolDetails);

//parents see their students route
router.get("/getRoutesForGuardian", guardianController.getRoutesForGuardian);
router.get("/getGuardianRouteCount", guardianController.getGuardianRouteCount);
router.get("/stop/:route_id", guardianController.getStopsByRouteId);
//parent sees every stop of their student
router.get("/getStopsForParent/:route_id", guardianController.getStopsForParent);

module.exports = router;
