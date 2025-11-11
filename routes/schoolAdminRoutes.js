const express = require("express");
const router = express.Router();
const schoolAdminController = require("../controllers/schoolAdminController");
const commonController = require("../controllers/commonController");
const reportController = require("../controllers/reportController");

const { upload, nUpload } = require("../middlewares/upload");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/proofs/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

// Class routes
router.post("/classes", schoolAdminController.createClass); // Create a new class
router.get("/classes", schoolAdminController.getAllClasses); // Get all classes
router.get("/classes/:id", schoolAdminController.getClassById);
router.put("/classes/:id", schoolAdminController.updateClass); // Update a class
router.delete("/classes/:id", schoolAdminController.deleteClass); // Soft delete a class
router.patch("/classes/:id", schoolAdminController.restoreClass);
router.get("/getTrashedClasses", schoolAdminController.getTrashedClasses);
router.delete(
  "/permanentDeleteClass/:id",
  schoolAdminController.permanentDeleteClass
);
//common controller
router.get("/getClassesByYear/:year", commonController.getClassesByYear); // Get classes by year

// Subject routes
router.post("/subjects", schoolAdminController.createSubject);
router.get("/subjects", schoolAdminController.getSubjects);
router.get("/subjects/:id", schoolAdminController.getSubjectById);
router.put("/subjects/:id", schoolAdminController.updateSubject);
router.delete("/subjects/:id", schoolAdminController.deleteSubject);
router.patch("/subjects/:id", schoolAdminController.restoreSubject);
router.get("/getTrashedSubjects", schoolAdminController.getTrashedSubjects);
router.delete(
  "/permanentDeleteSubject/:id",
  schoolAdminController.permanentDeleteSubject
);

//staff routes
router.post("/staffs", upload.single("dp"), schoolAdminController.createStaff);
router.get("/staffs", schoolAdminController.getAllStaff);
router.get("/staffs/:staff_id", schoolAdminController.getStaffById);
router.put(
  "/staffs/:staff_id",
  upload.single("dp"),
  schoolAdminController.updateStaff
);
router.get("/getStaffs", schoolAdminController.getStaffs);
router.put(
  "/updateStaffUser/:user_id",
  upload.single("dp"),
  schoolAdminController.updateStaffUser
);
router.delete("/staffs/:staff_id", schoolAdminController.deleteStaff);
router.patch("/staffs/:staff_id", schoolAdminController.restoredStaff);
router.get("/getAllTeachers", schoolAdminController.getAllTeachers);
router.get("/getTrashedStaffs", schoolAdminController.getTrashedStaffs);

//staff permissions
router.get(
  "/staffPermissions/:user_id",
  schoolAdminController.getStaffPermissionByUser
);
router.get("/staffPermissions", schoolAdminController.getAllStaffPermissions);
router.put(
  "/staffPermissions/:user_id",
  schoolAdminController.updateStaffPermission
);

// Guardian routes
router.post(
  "/guardian",
  upload.single("dp"),
  schoolAdminController.createGuardian
);
router.get("/guardian", schoolAdminController.getAllGuardians);
router.get("/guardian/:id", schoolAdminController.getGuardianById);
router.put(
  "/guardian/:id",
  upload.single("dp"),
  schoolAdminController.updateGuardian
);
router.delete("/guardian/:id", schoolAdminController.deleteGuardian);
router.get(
  "/getGuardianBySchoolId",
  schoolAdminController.getGuardianBySchoolId
);
router.put(
  "/updateGuardianUserPassword/:user_id",
  schoolAdminController.updateGuardianUserPassword
);

// Student routes
router.post(
  "/students",
  upload.fields([
    { name: "dp", maxCount: 1 }, // guardian image
    { name: "image", maxCount: 1 }, // student image
  ]),
  schoolAdminController.createStudent
);
router.post("/bulkCreateStudents", schoolAdminController.bulkCreateStudents);
router.get("/students", schoolAdminController.getAllStudents);
router.get("/students/:id", schoolAdminController.getStudentById);
router.put(
  "/students/:id",
  upload.single("image"),
  schoolAdminController.updateStudent
);
router.delete("/students/:id", schoolAdminController.deleteStudent);
//common controller
router.get(
  "/getStudentsByClassId/:class_id",
  commonController.getStudentsByClassId
);

//duty
router.post(
  "/duties",
  upload.single("file"),
  schoolAdminController.createDutyWithAssignments
);
router.get("/duties", schoolAdminController.getAllDuties);
router.get("/duties/:id", schoolAdminController.getDutyById);
router.put(
  "/duties/:id",
  upload.single("file"),
  schoolAdminController.updateDuty
);
router.delete("/duties/:id", schoolAdminController.deleteDuty);
router.patch("/duties/:id", schoolAdminController.restoreDuty);
router.get("/getTrashedDuties", schoolAdminController.getTrashedDuties);
router.delete(
  "/permanentDeleteDuty/:id",
  schoolAdminController.permanentDeleteDuty
);
router.put(
  "/updateDutyAssigned/:id",
  upload.single("solved_file"),
  schoolAdminController.updateDutyAssigned
);
router.put(
  "/bulkUpdateDutyAssignments/",
  schoolAdminController.bulkUpdateDutyAssignments
);
router.post(
  "/achievements",
  upload.any(),
  schoolAdminController.createAchievementWithStudents
);
router.get("/getAllAchievements", schoolAdminController.getAllAchievements);
router.get("/achievements/:id", schoolAdminController.getAchievementById);
router.put("/achievements/:id", schoolAdminController.updateAchievement);
router.delete("/achievements/:id", schoolAdminController.deleteAchievement);
router.patch("/achievements/:id", schoolAdminController.restoreAchievement);
router.get(
  "/getTrashedAchievements",
  schoolAdminController.getTrashedAchievements
);
router.put(
  "/updateStudentAchievement/:id",
  upload.single("proof_document"),
  schoolAdminController.updateStudentAchievement
);
//events
router.post(
  "/events",
  upload.single("file"),
  schoolAdminController.createEvent
);
router.get("/events", schoolAdminController.getAllEvents);
router.get("/events/:id", schoolAdminController.getEventById);
router.put(
  "/events/:id",
  upload.single("file"),
  schoolAdminController.updateEvent
);
router.delete("/events/:id", schoolAdminController.deleteEvent);
router.patch("/events/:id", schoolAdminController.restoreEvent);
router.get("/getTrashedEvents", schoolAdminController.getTrashedEvents);
router.delete(
  "/permanentDeleteEvent/:id",
  schoolAdminController.permanentDeleteEvent
);
//payment
router.post("/payments", schoolAdminController.createPayment);
router.get("/payments", schoolAdminController.getAllPayments);
router.get("/payments/:id", schoolAdminController.getPaymentById);
router.put("/payments/:id", schoolAdminController.updatePayment);
router.delete("/payments/:id", schoolAdminController.deletePayment);
router.patch("/payments/:id", schoolAdminController.restorePayment);
router.get("/getTrashedPayments", schoolAdminController.getTrashedPayments);
//invoice
router.post("/invoices", schoolAdminController.createInvoice);
router.post(
  "/addInvoiceStudentsbyInvoiceId/:id",
  schoolAdminController.addInvoiceStudentsbyInvoiceId
);
router.get("/invoices", schoolAdminController.getAllInvoices);
router.get("/invoices/:id", schoolAdminController.getInvoiceById);
router.put("/invoices/:id", schoolAdminController.updateInvoice);
router.delete("/invoices/:id", schoolAdminController.deleteInvoice);
router.patch("/invoices/:id", schoolAdminController.restoreInvoice);
router.delete(
  "/permanentDeleteInvoiceStudent/:id",
  schoolAdminController.permanentDeleteInvoiceStudent
);
router.get("/getTrashedInvoices", schoolAdminController.getTrashedInvoices);

//leave request
router.post(
  "/leaveRequest",
  upload.single("attachment"),
  schoolAdminController.createLeaveRequest
);
router.get("/leaveRequest", schoolAdminController.getAllLeaveRequests);
router.get("/leaveRequest/:id", schoolAdminController.getLeaveRequestById);
router.delete("/leaveRequest/:id", schoolAdminController.deleteLeaveRequest);
router.patch("/leaveRequest/:id", schoolAdminController.restoreLeaveRequest);
router.put(
  "/leaveRequest/:id",
  upload.single("attachment"),
  schoolAdminController.updateLeaveRequest
);
router.patch(
  "/leaveRequestpermission/:id",
  schoolAdminController.leaveRequestPermission
);
router.patch(
  "/staffLeaveRequestPermission/:id",
  schoolAdminController.staffLeaveRequestPermission
);

router.get(
  "/getAllStaffLeaveRequests",
  schoolAdminController.getAllStaffLeaveRequests
);
router.get(
  "/getAllTeacherLeaveRequests",
  schoolAdminController.getAllTeacherLeaveRequests
);

router.get(
  "/getAllStudentLeaveRequests",
  schoolAdminController.getAllStudentLeaveRequests
);
//news
router.post(
  "/news",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  schoolAdminController.createNews
);

router.get("/news", schoolAdminController.getAllNews);
router.get("/news/:id", schoolAdminController.getNewsById);
router.put(
  "/news/:id",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  schoolAdminController.updateNews
);
router.delete("/news/:id", schoolAdminController.deleteNews);
router.patch("/news/:id", schoolAdminController.restoreNews);
router.get("/getTrashedNews", schoolAdminController.getTrashedNews);
router.delete("/deleteNewsImage/:id", schoolAdminController.deleteNewsImage);

//notice
router.post(
  "/notices",
  nUpload.single("file"),
  schoolAdminController.createNotice
);
router.get("/notices", schoolAdminController.getAllNotices);
router.get("/notices/:id", schoolAdminController.getNoticeById);
router.put(
  "/notices/:id",
  nUpload.single("file"),
  schoolAdminController.updateNotice
);
router.delete("/notices/:id", schoolAdminController.deleteNotice);
router.patch("/notices/:id", schoolAdminController.restoreNotice);
router.get("/getTrashedNotices", schoolAdminController.getTrashedNotices);
router.get("/getLatestNotices", schoolAdminController.getLatestNotices);

router.post("/timetables", schoolAdminController.bulkUpsertTimetable);
router.get("/timetables", schoolAdminController.getAllTimetables);
router.get("/timetables/:id", schoolAdminController.getTimetableById);
router.delete("/timetables/:id", schoolAdminController.deleteTimetableEntry);
router.get(
  "/getTimetablesWithClassId/:class_id",
  schoolAdminController.getTimetablesWithClassId
);
router.get(
  "/getTimetablesConflicts",
  schoolAdminController.getTimetablesConflicts
);
router.get(
  "/getTimetableByTeacherId/:teacher_id",
  schoolAdminController.getTimetableByTeacherId
);

router.get(
  "/getAllTeacherLeaveRequestsforSubstitution",
  schoolAdminController.getAllTeacherLeaveRequestsforSubstitution
);
router.get(
  "/getPeriodsForleaveRequestedTeacher/:leaveRequest_id",
  schoolAdminController.getPeriodsForleaveRequestedTeacher
);
router.get(
  "/getFreeStaffForPeriod",
  schoolAdminController.getFreeStaffForPeriod
);
//substitution routes
router.post(
  "/timetableSubstitutions",
  schoolAdminController.createSubstitution
);
router.post(
  "/bulkTimetableSubstitutions",
  schoolAdminController.bulkCreateSubstitution
);
router.get(
  "/timetableSubstitutions",
  schoolAdminController.getAllSubstitutions
);
router.get(
  "/timetableSubstitutions/:id",
  schoolAdminController.getSubstitutionById
);
router.put(
  "/timetableSubstitutions/:id",
  schoolAdminController.updateSubstitution
);
router.delete(
  "/timetableSubstitutions/:id",
  schoolAdminController.deleteSubstitution
);

router.get(
  "/getSchoolAttendanceSummary",
  schoolAdminController.getSchoolAttendanceSummary
);

router.get(
  "/getNavigationBarCounts",
  schoolAdminController.getNavigationBarCounts
);
router.get(
  "/getInternalmarkById/:id",
  schoolAdminController.getInternalmarkById
);
router.get("/getHomeworkById/:id", schoolAdminController.getHomeworkById);
router.get("/getAttendanceById/:id", schoolAdminController.getAttendanceById);
//staff attendance
router.post("/staffAttendance", schoolAdminController.createStaffAttendance);
router.get("/staffAttendance", schoolAdminController.getAllStaffAttendance);
router.get(
  "/staffAttendance/:id",
  schoolAdminController.getStaffAttendanceById
);
router.put("/staffAttendance/:id", schoolAdminController.updateStaffAttendance);
router.delete(
  "/staffAttendance/:id",
  schoolAdminController.deleteStaffAttendance
);
router.post(
  "/bulkCreateStaffAttendance",
  schoolAdminController.bulkCreateStaffAttendance
);
router.get(
  "/staffAttendanceByDate",
  schoolAdminController.getStaffAttendanceByDate
);

//common Controller
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
//REPORTS
router.get("/invoiceReport", reportController.getInvoiceReport);
router.get("/paymentReport", reportController.getPaymentReport);
router.get("/attendanceReport", reportController.getAttendanceReport);
router.get("/homeworkReport", reportController.getHomeworkReport);
router.get(
  "/studentReport/:student_id",
  reportController.getStudentReportByStudentId
);
router.get("/internalmarksReport", reportController.getInternalmarksReport);

module.exports = router;
