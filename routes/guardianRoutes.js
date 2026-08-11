const express = require("express");
const router = express.Router();
const guardianController = require("../controllers/guardianController");
const commonController = require("../controllers/commonController");
const transferController = require("../controllers/transferController");
const { upload, uploadWithErrorHandler } = require("../middlewares/upload");
const { body, param } = require("express-validator");
const { validate } = require("../middlewares/validateMiddleware");
const { storageUploadMiddleware } = require("../middlewares/storageUploads");


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
router.post(
  "/payments",
  uploadWithErrorHandler(upload.single("payment_attachment")),
  storageUploadMiddleware("payment_attachments"),
  guardianController.createPayment,
);
router.put(
  "/payments/:id",
  uploadWithErrorHandler(upload.single("payment_attachment")),
  storageUploadMiddleware("payment_attachments"),
  guardianController.updatePayment,
)
const leaveRequestValidation = [
  body("student_id").notEmpty().trim().escape(),
  body("from_date").notEmpty().trim().escape(),
  body("to_date").notEmpty().trim().escape(),
  body("leave_type").notEmpty().trim().escape(),
  body("reason").notEmpty().trim().escape(),
  body("leave_duration").optional().trim().escape(),
  body("half_section").optional().trim().escape(),
];

router.post(
  "/leaveRequest",
  uploadWithErrorHandler(upload.single("attachment")),
  storageUploadMiddleware("leave_requests"),
  leaveRequestValidation,
  guardianController.createLeaveRequest,
);
router.get("/leaveRequest", guardianController.getAllLeaveRequests);
router.get("/leaveRequest/:id", guardianController.getLeaveRequestById);

router.put(
  "/leaveRequest/:id",
  uploadWithErrorHandler(upload.single("attachment")),
  storageUploadMiddleware("leave_requests"),
  leaveRequestValidation,
  guardianController.updateLeaveRequest,
);
router.delete("/leaveRequest/:id", guardianController.deleteLeaveRequest);

router.get("/getSchoolsByUser", guardianController.getSchoolsByUser);
router.get("/getSchoolById/:id", guardianController.getSchoolById);
  
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
  storageUploadMiddleware("students_images"),
  [body("address").optional().isString().trim().escape(), param("student_id")],
  guardianController.updateStudentProfile,
);
router.put(
  "/updateProfileDetails",
  uploadWithErrorHandler(upload.single("dp")),
  storageUploadMiddleware("guardians"),
  [
    body("guardian_relation").optional().isString().trim().escape(),
    body("guardian_job").optional().isString().trim().escape(),
    body("guardian2_relation").optional().isString().trim().escape(),
    body("guardian2_name").optional().isString().trim().escape(),
    body("guardian2_job").optional().isString().trim().escape(),
    body("guardian2_contact").optional().isString().trim().escape(),
    body("father_name").optional().isString().trim().escape(),
    body("mother_name").optional().isString().trim().escape(),
    body("house_name").optional().isString().trim().escape(),
    body("street").optional().isString().trim().escape(),
    body("city").optional().isString().trim().escape(),
    body("landmark").optional().isString().trim().escape(),
    body("district").optional().isString().trim().escape(),
    body("state").optional().isString().trim().escape(),
    body("country").optional().isString().trim().escape(),
    body("post").optional().isString().trim().escape(),
    body("pincode").optional().isString().trim().escape(),
  ],
  guardianController.updateProfileDetails,
);
router.put(
  "/changeIdentifiersAndName",
  [
    body("guardian_email").optional().isEmail().normalizeEmail(),
    body("guardian_name").optional().isString().trim().escape(),
    body("guardian_contact").optional().isString().trim().escape(),
  ],
  guardianController.changeIdentifiersAndName,
);
router.get("/getProfileDetails", guardianController.getProfileDetails);
router.put(
  "/updateHomeworkAssignment/:id",
  uploadWithErrorHandler(upload.single("solved_file")),
  storageUploadMiddleware("homework_assignments"),
  guardianController.updateHomeworkAssignment,
);
router.get("/getAchievementById/:id", guardianController.getAchievementById);
router.get("/getExams/:studentId", guardianController.getExamsByStudentId);
router.get("/getExamMarks/:studentId/:examId", guardianController.getExamMarksByStudentId);

router.get("/getParentNotesByStudentId/:student_id", guardianController.getParentNotesByStudentId);
router.get("/getParentNotesByIdAndStudentId/:id/:student_id", guardianController.getParentNotesByIdAndStudentId);
router.get("/getParentNoteUnseenCount/:student_id", guardianController.getParentNoteUnseenCount);


//common controller
router.get("/getLatestEvents", commonController.getLatestEvents);
router.get("/getLatestNews", commonController.getLatestNews);
router.get("/getLatestNotices", commonController.getLatestNotices);

router.get("/students/:id", commonController.getStudentDetailsById);
router.get("/getHomeworkByIdAndStudentId/:id/:student_id", commonController.getHomeworkByIdAndStudentId);
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
  "/getTermExamByStudentId/:student_id",
  commonController.getTermExamByStudentId,
);
router.get(
  "/getLeaveRequestByStudentId/:student_id",
  commonController.getLeaveRequestByStudentId,
);

router.put(
  "/changePassword",
  [
    body("oldPassword").notEmpty().isString(),
    body("newPassword").notEmpty().isString(),
  ],
  commonController.changePassword,
);
router.put(
  "/updateFcmToken",
  [body("fcm_token").optional().isString().trim().escape()],
  commonController.updateFcmToken,
);

router.put(
  "/updateDp",
  uploadWithErrorHandler(upload.single("dp")),
  storageUploadMiddleware("profileDp"),
  [],
  commonController.updateDp,
);

router.get("/getPaymentById/:id", commonController.getPaymentById);
router.get(
  "/getAchievementsBySchool",
  commonController.getAchievementsBySchool,
);

router.post(
  "/accountDeleteRequests",
  [body("reason").optional().isString().trim().escape()],
  commonController.accountDeleteRequests,
);

router.get("/getSchoolDetails", commonController.getSchoolDetails);

//parents see their students route
router.get("/getRoutesForGuardian", guardianController.getRoutesForGuardian);
router.get("/getGuardianRouteCount", guardianController.getGuardianRouteCount);
router.get("/stop/:route_id", guardianController.getStopsByRouteId);
//parent sees every stop of their student
router.get(
  "/getStopsForParent/:route_id",
  guardianController.getStopsForParent,
);

// Student Transfer routes
router.post(
  "/studentTransfer",
  [
    body("student_id").notEmpty().isInt(),
    body("to_school_id").notEmpty().isInt(),
    body("reason").optional().isString().trim().escape(),
  ],
  transferController.guardianCreateTransferRequest,
);
router.get("/studentTransfer", transferController.guardianGetTransferRequests);

module.exports = router;
