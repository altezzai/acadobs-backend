const express = require("express");
const router = express.Router();
const schoolAdminController = require("../controllers/schoolAdminController");
const trackerController = require("../controllers/tracker/trackerController");
const stopController = require("../controllers/tracker/stopController");
const routeController = require("../controllers/tracker/routeController");
const commonController = require("../controllers/commonController");
const reportController = require("../controllers/reportController");
const transferController = require("../controllers/transferController");
const publicController = require("../controllers/publicController");

const { upload, uploadWithErrorHandler } = require("../middlewares/upload");
const { storageUploadMiddleware } = require("../middlewares/storageUploads");

// Class routes
router.post("/classes", schoolAdminController.createClass); 
router.get("/classes", schoolAdminController.getAllClasses); 
router.get("/classes/:id", schoolAdminController.getClassById);
router.put("/classes/:id", schoolAdminController.updateClass);
router.delete("/classes/:id", schoolAdminController.deleteClass);
router.patch("/classes/:id", schoolAdminController.restoreClass);
router.get("/getSpecialClassesByYear/:year", schoolAdminController.getSpecialClassesByYear); // Get classes by year
router.get("/getTrashedClasses", schoolAdminController.getTrashedClasses);
router.delete(
  "/permanentDeleteClass/:id",
  schoolAdminController.permanentDeleteClass,
);
router.get("/getClassesByYear/:year", commonController.getClassesByYear);

//special class students routes
router.post(
  "/specialClassStudents",  
  schoolAdminController.addSpecialClassStudents,
);
router.get(
  "/specialClassStudents",
  schoolAdminController.getSpecialClassStudents,
);
router.get(
  "/specialClassStudents/:class_id",
  commonController.getSpecialClassStudentsByClassId,
);
router.put(
  "/specialClassStudents/:class_id",
  schoolAdminController.updateSpecialClassStudents,
);
router.delete(
  "/specialClassStudents/:id",
  schoolAdminController.deleteSpecialClassStudent,
);
// Subject routes
router.post("/subjects", schoolAdminController.createSubject);
router.get("/subjects", schoolAdminController.getSubjects);
router.get("/subjects/:id", schoolAdminController.getSubjectById);
router.put("/subjects/:id", schoolAdminController.updateSubject);
router.delete("/subjects/:id", schoolAdminController.deleteSubject);
router.patch("/subjects/:id", schoolAdminController.restoreSubject);
router.get("/getSubjectsForFilter", schoolAdminController.getSubjectsForFilter);
router.get("/getTrashedSubjects", schoolAdminController.getTrashedSubjects);
router.delete(
  "/permanentDeleteSubject/:id",
  schoolAdminController.permanentDeleteSubject,
);

//staff routes
router.post(
  "/staffs",
  uploadWithErrorHandler(upload.single("dp")),
  storageUploadMiddleware("staffs"),
  schoolAdminController.createStaff,
);
router.get("/staffs", schoolAdminController.getAllStaff);
router.get("/staffs/:staff_id", schoolAdminController.getStaffById);
router.put(
  "/staffs/:staff_id",
  uploadWithErrorHandler(upload.single("dp")),
  storageUploadMiddleware("staffs"),
  schoolAdminController.updateStaff,
);
router.get("/getStaffs", schoolAdminController.getStaffs);
router.put(
  "/updateStaffUser/:user_id",
  uploadWithErrorHandler(upload.single("dp")),
  storageUploadMiddleware("staffs"),
  schoolAdminController.updateStaffUser,
);
router.delete("/staffs/:staff_id", schoolAdminController.deleteStaff);
router.patch("/staffs/:staff_id", schoolAdminController.restoredStaff);
router.get("/getAllTeachers", schoolAdminController.getAllTeachers);
router.get("/getTrashedStaffs", schoolAdminController.getTrashedStaffs);

//staff permissions
router.get(
  "/staffPermissions/:user_id",
  schoolAdminController.getStaffPermissionByUser,
);
router.get("/staffPermissions", schoolAdminController.getAllStaffPermissions);
router.put(
  "/staffPermissions/:user_id",
  schoolAdminController.updateStaffPermission,
);

// Guardian routes
router.post(
  "/guardian",
  uploadWithErrorHandler(upload.single("dp")),
  storageUploadMiddleware("guardians"),
  schoolAdminController.createGuardian,
);
router.get("/guardian", schoolAdminController.getAllGuardians);
router.get("/guardian/:id", schoolAdminController.getGuardianById);
router.put(
  "/guardian/:id",
  uploadWithErrorHandler(upload.single("dp")),
  schoolAdminController.updateGuardian,
);
router.delete("/guardian/:id", schoolAdminController.deleteGuardian);
router.get(
  "/getGuardianBySchoolId",
  schoolAdminController.getGuardianBySchoolId,
);
router.put(
  "/updateGuardianUserPassword/:user_id",
  schoolAdminController.updateGuardianUserPassword,
);

// Student routes
router.post(
  "/students",
  uploadWithErrorHandler(
    upload.fields([
      { name: "dp", maxCount: 1 },
      { name: "image", maxCount: 1 }, 
    ]),
  ),
  storageUploadMiddleware("students"),
  schoolAdminController.createStudent,
);
router.post("/bulkCreateStudents", schoolAdminController.bulkCreateStudents);
router.get("/students", schoolAdminController.getAllStudents);
router.get("/students/:id", schoolAdminController.getStudentById);
router.put(
  "/students/:id",
  uploadWithErrorHandler(upload.single("image")),
  schoolAdminController.updateStudent,
);
router.delete("/students/:id", schoolAdminController.deleteStudent);
router.patch("/students/:id", schoolAdminController.restoreStudent);
router.get("/getTrashedStudents", schoolAdminController.getTrashedStudents);
router.put(
  "/bulkUpdateStudentsToAlumni",
  schoolAdminController.bulkUpdateStudentsToAlumni,
);
router.get("/getAlumniStudents", schoolAdminController.getAlumniStudents);
router.get(
  "/getTrashedAlumniStudents",
  schoolAdminController.getTrashedAlumniStudents,
);

//common controller
router.get(
  "/getStudentsByClassId/:class_id",
  commonController.getStudentsByClassId,
);

//duty
router.post(
  "/duties",
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("duties"),
  schoolAdminController.createDutyWithAssignments,
);
router.get("/duties", schoolAdminController.getAllTeacherDuties);
router.get("/getStaffDuties", schoolAdminController.getAllStaffDuties);

router.get("/duties/:id", schoolAdminController.getDutyById);
router.put(
  "/duties/:id",
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("duties"),
  schoolAdminController.updateDuty,
);
router.delete("/duties/:id", schoolAdminController.deleteDuty);
router.patch("/duties/:id", schoolAdminController.restoreDuty);
router.get("/getTrashedDuties", schoolAdminController.getTrashedDuties);
router.delete(
  "/permanentDeleteDuty/:id",
  schoolAdminController.permanentDeleteDuty,
);
router.put(
  "/updateDutyAssigned/:id",
  uploadWithErrorHandler(upload.single("solved_file")),
  schoolAdminController.updateDutyAssigned,
);
router.put(
  "/bulkUpdateDutyAssignments/",
  schoolAdminController.bulkUpdateDutyAssignments,
);
router.post(
  "/achievements",
  uploadWithErrorHandler(upload.any()),
  schoolAdminController.createAchievementWithStudents,
);
router.get("/achievements", schoolAdminController.getAllAchievements);
router.get("/achievements/:id", schoolAdminController.getAchievementById);
router.put("/achievements/:id", schoolAdminController.updateAchievement);
router.delete("/achievements/:id", schoolAdminController.deleteAchievement);
router.patch("/achievements/:id", schoolAdminController.restoreAchievement);
router.get(
  "/getTrashedAchievements",
  schoolAdminController.getTrashedAchievements,
);
router.put(
  "/updateStudentAchievement/:id",
  uploadWithErrorHandler(upload.single("proof_document")),
  schoolAdminController.updateStudentAchievement,
);
//events
router.post(
  "/events",
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("events"),
  schoolAdminController.createEvent,
);
router.get("/events", schoolAdminController.getAllEvents);
router.get("/events/:id", schoolAdminController.getEventById);
router.put(
  "/events/:id",
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("events"),
  schoolAdminController.updateEvent,
);
router.delete("/events/:id", schoolAdminController.deleteEvent);
router.patch("/events/:id", schoolAdminController.restoreEvent);
router.get("/getTrashedEvents", schoolAdminController.getTrashedEvents);
router.delete(
  "/permanentDeleteEvent/:id",
  schoolAdminController.permanentDeleteEvent,
);
//payment
router.post("/payments", schoolAdminController.createPayment);
router.get("/payments", schoolAdminController.getAllPayments);
router.get("/donations", schoolAdminController.getDonations);
router.get("/payments/:id", schoolAdminController.getPaymentById);
router.put("/payments/:id", schoolAdminController.updatePayment);
router.delete("/payments/:id", schoolAdminController.deletePayment);
router.patch("/payments/:id", schoolAdminController.restorePayment);
router.get("/getTrashedPayments", schoolAdminController.getTrashedPayments);
router.get("/getTrashedDonations", schoolAdminController.getTrashedDonations);
router.delete(
  "/permanentDeletePayment/:id",
  schoolAdminController.permanentDeletePayment,
);
//invoice
router.post("/invoices", schoolAdminController.createInvoice);
router.post(
  "/addInvoiceStudentsbyInvoiceId/:id",
  schoolAdminController.addInvoiceStudentsbyInvoiceId,
);
router.get("/invoices", schoolAdminController.getAllInvoices);
router.get("/invoices/:id", schoolAdminController.getInvoiceById);
router.put("/invoices/:id", schoolAdminController.updateInvoice);
router.delete("/invoices/:id", schoolAdminController.deleteInvoice);
router.patch("/invoices/:id", schoolAdminController.restoreInvoice);
router.delete(
  "/permanentDeleteInvoiceStudent/:id",
  schoolAdminController.permanentDeleteInvoiceStudent,
);
router.get("/getTrashedInvoices", schoolAdminController.getTrashedInvoices);

//leave request
router.post(
  "/leaveRequest",
  uploadWithErrorHandler(upload.single("attachment")),
  storageUploadMiddleware("leaverequests"),
  schoolAdminController.createLeaveRequest,
);
router.get("/leaveRequest", schoolAdminController.getAllStudentLeaveRequests);
router.get("/leaveRequest/:id", schoolAdminController.getLeaveRequestById);
router.delete("/leaveRequest/:id", schoolAdminController.deleteLeaveRequest);
router.patch("/leaveRequest/:id", schoolAdminController.restoreLeaveRequest);
router.delete(
  "/permanentDeleteLeaveRequest/:id",
  schoolAdminController.permanentDeleteLeaveRequest,
);
router.put(
  "/leaveRequest/:id",
  uploadWithErrorHandler(upload.single("attachment")),
  storageUploadMiddleware("leaverequests"),
  schoolAdminController.updateLeaveRequest,
);
router.patch(
  "/leaveRequestpermission/:id",
  schoolAdminController.leaveRequestPermission,
);
router.patch(
  "/staffLeaveRequestPermission/:id",
  schoolAdminController.staffLeaveRequestPermission,
);

router.get(
  "/getAllStaffLeaveRequests",
  schoolAdminController.getAllStaffLeaveRequests,
);
router.get(
  "/getAllTeacherLeaveRequests",
  schoolAdminController.getAllTeacherLeaveRequests,
);

router.get(
  "/getAllStudentLeaveRequests",
  schoolAdminController.getAllStudentLeaveRequests,
);
//news
router.post(
  "/news",
  uploadWithErrorHandler(
    upload.fields([
      // { name: "file", maxCount: 1 },
      { name: "images", maxCount: 10 },
    ]),
  ),
  storageUploadMiddleware("news"),
  schoolAdminController.createNews,
);

router.get("/news", schoolAdminController.getAllNews);
router.get("/news/:id", schoolAdminController.getNewsById);
router.put(
  "/news/:id",
  upload.fields([
    // { name: "file", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  storageUploadMiddleware("news"),
  schoolAdminController.updateNews,
);
router.delete("/news/:id", schoolAdminController.deleteNews);
router.patch("/news/:id", schoolAdminController.restoreNews);
router.get("/getTrashedNews", schoolAdminController.getTrashedNews);
router.delete(
  "/permanentDeleteNews/:id",
  schoolAdminController.permanentDeleteNews,
);
router.delete("/deleteNewsImage/:id", schoolAdminController.deleteNewsImage);

//notice
router.post(
  "/notices",
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("notices"),
  schoolAdminController.createNotice,
);
router.get("/notices", schoolAdminController.getAllNotices);
router.get("/notices/:id", schoolAdminController.getNoticeById);
router.put(
  "/notices/:id",
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("notices"),
  schoolAdminController.updateNotice,
);
router.delete("/notices/:id", schoolAdminController.deleteNotice);
router.patch("/notices/:id", schoolAdminController.restoreNotice);
router.delete(
  "/permanentDeleteNotice/:id",
  schoolAdminController.permanentDeleteNotice,
);
router.get("/getTrashedNotices", schoolAdminController.getTrashedNotices);
router.get("/getLatestNotices", schoolAdminController.getLatestNotices);

router.post("/timetables", schoolAdminController.bulkUpsertTimetable);
router.get("/timetables", schoolAdminController.getAllTimetables);
router.get("/timetables/:id", schoolAdminController.getTimetableById);
router.delete("/timetables/:id", schoolAdminController.deleteTimetableEntry);
router.get(
  "/getTimetablesWithClassId/:class_id",
  schoolAdminController.getTimetablesWithClassId,
);
router.get(
  "/getTimetablesConflicts",
  schoolAdminController.getTimetablesConflicts,
);
router.get(
  "/getTimetableByTeacherId/:teacher_id",
  schoolAdminController.getTimetableByTeacherId,
);

router.get(
  "/getAllTeacherLeaveRequestsforSubstitution",
  schoolAdminController.getAllTeacherLeaveRequestsforSubstitution,
);
router.get(
  "/getPeriodsForleaveRequestedTeacher/:leaveRequest_id",
  schoolAdminController.getPeriodsForleaveRequestedTeacher,
);
router.get(
  "/getFreeStaffForPeriod",
  schoolAdminController.getFreeStaffForPeriod,
);
//substitution routes
router.post(
  "/timetableSubstitutions",
  schoolAdminController.createSubstitution,
);
router.post(
  "/bulkTimetableSubstitutions",
  schoolAdminController.bulkCreateSubstitution,
);
router.get(
  "/timetableSubstitutions",
  schoolAdminController.getAllSubstitutions,
);
router.get(
  "/timetableSubstitutions/:id",
  schoolAdminController.getSubstitutionById,
);
router.put(
  "/timetableSubstitutions/:id",
  schoolAdminController.updateSubstitution,
);
router.delete(
  "/timetableSubstitutions/:id",
  schoolAdminController.deleteSubstitution,
);

router.get(
  "/getSchoolAttendanceSummary",
  schoolAdminController.getSchoolAttendanceSummary,
);

router.get(
  "/getNavigationBarCounts",
  schoolAdminController.getNavigationBarCounts,
);
router.get("/dashboardCounts", schoolAdminController.dashboardCounts);
router.get(
  "/getInternalmarkById/:id",
  schoolAdminController.getInternalmarkById,
);
router.get("/getHomeworkById/:id", schoolAdminController.getHomeworkById);
router.get("/getAttendanceById/:id", schoolAdminController.getAttendanceById);
//staff attendance
router.post("/staffAttendance", schoolAdminController.createStaffAttendance);
router.get("/staffAttendance", schoolAdminController.getAllStaffAttendance);
router.get(
  "/staffAttendance/:id",
  schoolAdminController.getStaffAttendanceById,
);
router.put("/staffAttendance/:id", schoolAdminController.updateStaffAttendance);
router.delete(
  "/staffAttendance/:id",
  schoolAdminController.deleteStaffAttendance,
);
router.post(
  "/bulkCreateStaffAttendance",
  schoolAdminController.bulkCreateStaffAttendance,
);
router.get(
  "/staffAttendanceByDate",
  schoolAdminController.getStaffAttendanceByDate,
);
router.post("/exams", schoolAdminController.createExam);
router.put("/exams/:id", schoolAdminController.editExam);
router.delete("/exams/:id", schoolAdminController.deleteExam);
router.patch("/exams/:id/restore", schoolAdminController.restoreExam);

router.get("/getExams", schoolAdminController.getExams);
router.get(
  "/getExamMarksByExamId/:exam_id",
  schoolAdminController.getExamMarksByExamId,
);
router.get(
  "/getMarksByInternalId/:id",
  schoolAdminController.getMarksByInternalId,
);
router.put(
  "/updateExamPublishStatus/:id",
  schoolAdminController.updateExamPublishStatus,
);
router.post(
  "/assignDriverToRoutes/:driverId",
  schoolAdminController.assignDriverToRoutes,
);
router.post(
  "/assign-student-route",
  upload.none(),
  schoolAdminController.assignStudentToRoute,
);
router.put(
  "/update-student-route/:route_id",
  schoolAdminController.updateStudentToRoute,
);
router.delete(
  "/deleteStudentFromRoute/:route_id",
  schoolAdminController.deleteStudentFromRoute,
);
router.put(
  "/updateVehicle/:id",
  uploadWithErrorHandler(upload.fields([{ name: "photo", maxCount: 10 }])),
  storageUploadMiddleware("vehicles"),
  schoolAdminController.updateVehicle,
);

router.get(
  "/getDriversAssignedToRoutes",
  schoolAdminController.getDriversAssignedToRoutes,
);
router.put("/updateIsLock/:route_id", schoolAdminController.updateIsLock);
router.get(
  "/getDriverLocation/:driver_id",
  schoolAdminController.getDriverLocation,
);

//REPORTS
router.get("/invoiceReport", reportController.getInvoiceReport);
router.get("/paymentReport", reportController.getPaymentReport);
router.get("/attendanceReport", reportController.getAttendanceReport);
router.get("/homeworkReport", reportController.getHomeworkReport);
router.get(
  "/studentReport/:student_id",
  reportController.getStudentReportByStudentId,
);
router.get("/internalmarksReport", reportController.getInternalmarksReport);

/////////////////tracker//////////////////////////////////////

router.post(
  "/driver",
  uploadWithErrorHandler(upload.fields([{ name: "photo", maxCount: 10 }])),
  storageUploadMiddleware("drivers"),
  schoolAdminController.createDriver,
);
router.post(
  "/vehicle",
  uploadWithErrorHandler(upload.fields([{ name: "photo", maxCount: 10 }])),
  storageUploadMiddleware("vehicles"),
  schoolAdminController.createVehicle,
);
router.get("/getAllVehicles", schoolAdminController.getAllVehicles);
router.get("/getVehicleById/:id", schoolAdminController.getVehicleById);
router.delete("/deleteVehicle/:id", schoolAdminController.deleteVehicle);
router.get("/getAllRoutes", schoolAdminController.getAllRoutes);
router.get("/getDriverById/:id", trackerController.getDriverById);
router.get("/getAllDrivers", schoolAdminController.getAllDrivers);
router.put(
  "/updateDriverById/:id",
  uploadWithErrorHandler(upload.fields([{ name: "photo", maxCount: 10 }])),
  storageUploadMiddleware("drivers"),
  trackerController.updateDriverById,
);
router.delete("/deleteDriverById/:id", trackerController.deleteDriverById);
router.post("/stop", schoolAdminController.createStop);
router.get("/getStopById/:id", stopController.getStopById);
router.delete("/deleteStop/:id", stopController.deleteStop);
router.post("/route", upload.none(), schoolAdminController.createRoute);
router.get("/getRouteById/:id", routeController.getRouteById);
router.put("/updateRouteById/:id", routeController.updateRouteById);
router.delete("/deleteRoute/:id", routeController.deleteRoute);
router.get(
  "/getDriverAssignedRoutes/:driverId",
  trackerController.getDriverAssignedRoutesAdmin,
);

// Student Transfer routes
router.post("/studentTransfer", transferController.adminCreateTransferRequest);
router.get(
  "/studentTransfer/outgoing",
  transferController.adminGetOutgoingTransferRequests,
);
router.get(
  "/studentTransfer/incoming",
  transferController.adminGetIncomingTransferRequests,
);
router.get(
  "/studentTransfer/:id",
  transferController.adminGetTransferRequestById,
);
router.patch(
  "/studentTransfer/:id/review",
  transferController.adminReviewTransferRequest,
);
router.delete(
  "/studentTransfer/:id",
  transferController.adminDeleteTransferRequest,
);

router.get("/getSchoolsList", publicController.getSchoolsList);

//common Controller
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
router.get("/getStaffsForFilter", commonController.getStaffsForFilter);
router.get("/getClassesByYear/:year", commonController.getClassesByYear);
router.get(
  "/getStudentsByClassId/:class_id",
  commonController.getStudentsByClassId,
);

module.exports = router;
