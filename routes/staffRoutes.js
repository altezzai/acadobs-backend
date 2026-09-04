const express = require("express");
const router = express.Router();
const schoolAdminController = require("../controllers/schoolAdminController");
const trackerController = require("../controllers/trackerController");
const commonController = require("../controllers/commonController");
const reportController = require("../controllers/reportController");
const transferController = require("../controllers/transferController");
const publicController = require("../controllers/publicController");
const teacherController = require("../controllers/teacherController");

const { upload, uploadWithErrorHandler } = require("../middlewares/upload");
const { storageUploadMiddleware } = require("../middlewares/storageUploads");
const { checkStaffPermission } = require("../middlewares/staffMiddleware");

const achievementPermission = checkStaffPermission("achievements");
const eventPermission = checkStaffPermission("events");
const paymentPermission = checkStaffPermission("payments");
const leaveRequestPermission = checkStaffPermission(["teachers_leaveReuest", "staffs_leaveReuest","student_leave_request"]);
const newsPermission = checkStaffPermission("news");
const noticePermission = checkStaffPermission("notice");
const timetablePermission = checkStaffPermission("timetable");
const examPermission = checkStaffPermission("exam");
const commonInternalPermission =checkStaffPermission(["marks","exam"]);
const studentPermission = checkStaffPermission("students");
const dutyPermission = checkStaffPermission(["staffs_duties", "teachers_duties"]);
const teacherDutyPermission = checkStaffPermission("teachers_duties");
const staffDutyPermission = checkStaffPermission("staffs_duties");
const attendancePermission = checkStaffPermission(["staffs_attendance", "teachers_attendance"]);
const homeworkPermission = checkStaffPermission("homeworks");
const internalMarksPermission = checkStaffPermission("marks");
const studentsAttendancePermission = checkStaffPermission("attendance");
const transportationPermission = checkStaffPermission("transportation");
const reportPermission = checkStaffPermission([
  "reports",
  "payments",
  "attendance",
  "homeworks",
  "marks",
]);

router.get("/getSpecialClassesByYear/:year", schoolAdminController.getSpecialClassesByYear); // Get classes by year
router.get("/classes", schoolAdminController.getAllClasses); 

//staffs
router.get("/staffs", schoolAdminController.getAllStaff);
router.get("/getAllTeachers", schoolAdminController.getAllTeachers);
// Student routes

router.post(
  "/students",
  studentPermission,
  uploadWithErrorHandler(
    upload.fields([
      { name: "dp", maxCount: 1 },
      { name: "image", maxCount: 1 }, 
    ]),
  ),
  storageUploadMiddleware("students"),
  schoolAdminController.createStudent,
);
router.post("/bulkCreateStudents", studentPermission, schoolAdminController.bulkCreateStudents);
router.get("/students", studentPermission, schoolAdminController.getAllStudents);
router.get("/students/:id", studentPermission, schoolAdminController.getStudentById);
router.put(
  "/students/:id",
  studentPermission,
  uploadWithErrorHandler(upload.single("image")),
  schoolAdminController.updateStudent,
);
router.delete("/students/:id", studentPermission, schoolAdminController.deleteStudent);
router.patch("/students/:id", studentPermission, schoolAdminController.restoreStudent);
router.get("/getTrashedStudents", studentPermission, schoolAdminController.getTrashedStudents);
router.put(
  "/bulkUpdateStudentsToAlumni",
  studentPermission,
  schoolAdminController.bulkUpdateStudentsToAlumni,
);
router.put(
  "/bulkUpdateStudentsClass",
  studentPermission,
  schoolAdminController.bulkUpdateStudentsClass,
);
router.get("/getSpecialClassesByYear/:year", schoolAdminController.getSpecialClassesByYear); 
router.get("/getAlumniStudents", studentPermission, schoolAdminController.getAlumniStudents);
router.get(
  "/getTrashedAlumniStudents",
  studentPermission,
  schoolAdminController.getTrashedAlumniStudents,
);

//common controller
router.get(
  "/getStudentsByClassId/:class_id",
  studentPermission,
  commonController.getStudentsByClassId,
);
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
router.delete(
  "/specialClassStudents/:id",
  schoolAdminController.deleteSpecialClassStudent,
);
//duty

router.get("/duties", teacherDutyPermission, schoolAdminController.getAllTeacherDuties);
router.get("/getStaffDuties", staffDutyPermission, schoolAdminController.getAllStaffDuties);

router.post(
  "/duties",
  dutyPermission,
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("duties"),
  schoolAdminController.createDutyWithAssignments,
);

router.get("/duties/:id", dutyPermission, schoolAdminController.getDutyById);
router.put(
  "/duties/:id",
  dutyPermission,
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("duties"),
  schoolAdminController.updateDuty,
);
router.delete("/duties/:id", dutyPermission, schoolAdminController.deleteDuty);
router.patch("/duties/:id", dutyPermission, schoolAdminController.restoreDuty);
router.get("/getTrashedDuties", dutyPermission, schoolAdminController.getTrashedDuties);
router.delete(
  "/permanentDeleteDuty/:id",
  dutyPermission,
  schoolAdminController.permanentDeleteDuty,
);
router.put(
  "/updateDutyAssigned/:id",
  dutyPermission,
  uploadWithErrorHandler(upload.single("solved_file")),
  schoolAdminController.updateDutyAssigned,
);
router.put(
  "/bulkUpdateDutyAssignments/",
  dutyPermission,
  schoolAdminController.bulkUpdateDutyAssignments,
);
//Achievements
router.post(
  "/achievements",
  achievementPermission,
  uploadWithErrorHandler(upload.any()),
  schoolAdminController.createAchievementWithStudents,
);
router.get("/achievements", achievementPermission,schoolAdminController.getAllAchievements);
router.get("/achievements/:id",achievementPermission, schoolAdminController.getAchievementById);
router.put("/achievements/:id", achievementPermission, schoolAdminController.updateAchievement);
router.delete("/achievements/:id", achievementPermission, schoolAdminController.deleteAchievement);
router.patch("/achievements/:id", achievementPermission, schoolAdminController.restoreAchievement);
router.get(
  "/getTrashedAchievements",
  achievementPermission,
  schoolAdminController.getTrashedAchievements,
);
router.put(
  "/updateStudentAchievement/:id",
  achievementPermission,
  uploadWithErrorHandler(upload.any()),
  schoolAdminController.updateStudentAchievement,
);
//events
router.post(
  "/events",
  eventPermission,
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("events"),
  schoolAdminController.createEvent,
);
router.get("/events", eventPermission, schoolAdminController.getAllEvents);
router.get("/events/:id", eventPermission, schoolAdminController.getEventById);
router.put(
  "/events/:id",
  eventPermission,
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("events"),
  schoolAdminController.updateEvent,
);
router.delete("/events/:id", eventPermission, schoolAdminController.deleteEvent);
router.patch("/events/:id", eventPermission, schoolAdminController.restoreEvent);
router.get("/getTrashedEvents", eventPermission, schoolAdminController.getTrashedEvents);
router.delete(
  "/permanentDeleteEvent/:id",
  eventPermission,
  schoolAdminController.permanentDeleteEvent,
);
//payment
router.post("/payments", paymentPermission, schoolAdminController.createPayment);
router.get("/payments", paymentPermission, schoolAdminController.getAllPayments);
router.get("/donations", paymentPermission, schoolAdminController.getDonations);
router.get("/payments/:id", paymentPermission, schoolAdminController.getPaymentById);
router.put("/payments/:id", paymentPermission, schoolAdminController.updatePayment);
router.delete("/payments/:id", paymentPermission, schoolAdminController.deletePayment);
router.patch("/payments/:id", paymentPermission, schoolAdminController.restorePayment);
router.get("/getTrashedPayments", paymentPermission, schoolAdminController.getTrashedPayments);
router.get("/getTrashedDonations", paymentPermission, schoolAdminController.getTrashedDonations);
router.delete(
  "/permanentDeletePayment/:id",
  paymentPermission,
  schoolAdminController.permanentDeletePayment,
);
//invoice
router.post("/invoices",paymentPermission, schoolAdminController.createInvoice);
router.post(
  "/addInvoiceStudentsbyInvoiceId/:id",
  paymentPermission,
  schoolAdminController.addInvoiceStudentsbyInvoiceId,
);
router.get("/invoices", paymentPermission, schoolAdminController.getAllInvoices);
router.get("/invoices/:id", paymentPermission, schoolAdminController.getInvoiceById);
router.put("/invoices/:id", paymentPermission, schoolAdminController.updateInvoice);
router.delete("/invoices/:id", paymentPermission, schoolAdminController.deleteInvoice);
router.patch("/invoices/:id", paymentPermission, schoolAdminController.restoreInvoice);
router.delete(
  "/permanentDeleteInvoiceStudent/:id",
  paymentPermission,
  schoolAdminController.permanentDeleteInvoiceStudent,
);
router.get("/getTrashedInvoices", paymentPermission, schoolAdminController.getTrashedInvoices);

//leave request
router.post(
  "/leaveRequest",
  leaveRequestPermission,
  uploadWithErrorHandler(upload.single("attachment")),
  storageUploadMiddleware("leaverequests"),
  schoolAdminController.createLeaveRequest,
);
router.get("/leaveRequest", leaveRequestPermission, schoolAdminController.getAllStudentLeaveRequests);
router.get("/leaveRequest/:id", leaveRequestPermission, schoolAdminController.getLeaveRequestById);
router.delete("/leaveRequest/:id", leaveRequestPermission, schoolAdminController.deleteLeaveRequest);
router.patch("/leaveRequest/:id", leaveRequestPermission, schoolAdminController.restoreLeaveRequest);
router.delete(
  "/permanentDeleteLeaveRequest/:id",
  leaveRequestPermission,
  schoolAdminController.permanentDeleteLeaveRequest,
);
router.put(
  "/leaveRequest/:id",
  leaveRequestPermission,
  uploadWithErrorHandler(upload.single("attachment")),
  storageUploadMiddleware("leaverequests"),
  schoolAdminController.updateLeaveRequest,
);
router.patch(
  "/leaveRequestpermission/:id",
  leaveRequestPermission, 
  schoolAdminController.leaveRequestPermission,
);
router.patch(
  "/staffLeaveRequestPermission/:id",
  leaveRequestPermission,
  schoolAdminController.staffLeaveRequestPermission,
);

router.get(
  "/getAllStaffLeaveRequests",
  leaveRequestPermission,
  schoolAdminController.getAllStaffLeaveRequests,
);
router.get(
  "/getAllTeacherLeaveRequests",
  leaveRequestPermission,
  schoolAdminController.getAllTeacherLeaveRequests,
);

router.get(
  "/getAllStudentLeaveRequests",
  leaveRequestPermission,
  schoolAdminController.getAllStudentLeaveRequests,
);
//news
router.post(
  "/news",
  newsPermission,
  uploadWithErrorHandler(
    upload.fields([
      // { name: "file", maxCount: 1 },
      { name: "images", maxCount: 10 },
    ]),
  ),
  storageUploadMiddleware("news"),
  schoolAdminController.createNews,
);

router.get("/news", newsPermission, schoolAdminController.getAllNews);
router.get("/news/:id", newsPermission, schoolAdminController.getNewsById);
router.put(
  "/news/:id",
  newsPermission,
  upload.fields([
    // { name: "file", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  storageUploadMiddleware("news"),
  schoolAdminController.updateNews,
);
router.delete("/news/:id", newsPermission, schoolAdminController.deleteNews);
router.patch("/news/:id", newsPermission, schoolAdminController.restoreNews);
router.get("/getTrashedNews", newsPermission, schoolAdminController.getTrashedNews);
router.delete(
  "/permanentDeleteNews/:id",
  newsPermission,
  schoolAdminController.permanentDeleteNews,
);
router.delete("/deleteNewsImage/:id", newsPermission, schoolAdminController.deleteNewsImage);

//notice
router.post(
  "/notices",
  noticePermission,
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("notices"),
  schoolAdminController.createNotice,
);
router.get("/notices", noticePermission, schoolAdminController.getAllNotices);
router.get("/notices/:id", noticePermission, schoolAdminController.getNoticeById);
router.put(
  "/notices/:id",
  noticePermission,
  uploadWithErrorHandler(upload.single("file")),
  storageUploadMiddleware("notices"),
  schoolAdminController.updateNotice,
);
router.delete("/notices/:id", noticePermission, schoolAdminController.deleteNotice);
router.patch("/notices/:id", noticePermission, schoolAdminController.restoreNotice);
router.delete(
  "/permanentDeleteNotice/:id",
  noticePermission, 
  schoolAdminController.permanentDeleteNotice,
);
router.get("/getTrashedNotices", noticePermission, schoolAdminController.getTrashedNotices);
router.get("/getLatestNotices", noticePermission, schoolAdminController.getLatestNotices);

//timetable
router.post("/timetables",timetablePermission, schoolAdminController.bulkUpsertTimetable);
router.get("/timetables", timetablePermission, schoolAdminController.getAllTimetables);
router.get("/timetables/:id", timetablePermission, schoolAdminController.getTimetableById);
router.delete("/timetables/:id", timetablePermission, schoolAdminController.deleteTimetableEntry);
router.get(
  "/getTimetablesWithClassId/:class_id",
  timetablePermission,
  schoolAdminController.getTimetablesWithClassId,
);
router.get(
  "/getTimetablesConflicts",
  timetablePermission,
  schoolAdminController.getTimetablesConflicts,
);
router.get(
  "/getTimetableByTeacherId/:teacher_id",
  timetablePermission,
  schoolAdminController.getTimetableByTeacherId,
);

router.get(
  "/getAllTeacherLeaveRequestsforSubstitution",
  timetablePermission,
  schoolAdminController.getAllTeacherLeaveRequestsforSubstitution,
);
router.get(
  "/getPeriodsForleaveRequestedTeacher/:leaveRequest_id",
  timetablePermission,
  schoolAdminController.getPeriodsForleaveRequestedTeacher,
);
router.get(
  "/getFreeStaffForPeriod",
  timetablePermission,
  schoolAdminController.getFreeStaffForPeriod,
);
//substitution routes
router.post(
  "/timetableSubstitutions",
  timetablePermission,
  schoolAdminController.createSubstitution,
);
router.post(
  "/bulkTimetableSubstitutions",
  timetablePermission,
  schoolAdminController.bulkCreateSubstitution,
);
router.get(
  "/timetableSubstitutions",
  timetablePermission,
  schoolAdminController.getAllSubstitutions,
);
router.get(
  "/timetableSubstitutions/:id",
  timetablePermission,
  schoolAdminController.getSubstitutionById,
);
router.put(
  "/timetableSubstitutions/:id",
  timetablePermission,
  schoolAdminController.updateSubstitution,
);
router.delete(
  "/timetableSubstitutions/:id",
  timetablePermission,
  schoolAdminController.deleteSubstitution,
);
//dashboard
router.get(
  "/getSchoolAttendanceSummary",
  schoolAdminController.getSchoolAttendanceSummary,
);

router.get(
  "/getNavigationBarCounts",
  schoolAdminController.getNavigationBarCounts,
);
router.get("/dashboardCounts", schoolAdminController.dashboardCounts);

router.get("/getAllInternalMarks", internalMarksPermission,schoolAdminController.getAllInternalMarks);
router.get("/getAllTermExams",examPermission, schoolAdminController.getAllTermExams);
router.get("/getInternalmarkById/:id",commonInternalPermission,schoolAdminController.getInternalmarkById,);
router.put("/updateInternalmark/:id", commonInternalPermission,schoolAdminController.updateInternalMark);  
router.delete("/deleteInternalmark/:id",commonInternalPermission, schoolAdminController.deleteInternalMark);
router.get("/getTrashedInternalmarks",internalMarksPermission, schoolAdminController.getTrashedInternalMarks);
router.get("/getTrashedTermExams",examPermission, schoolAdminController.getTrashedTermExams);
router.patch("/restoreInternalmark/:id",commonInternalPermission,schoolAdminController.restoreInternalMark);
router.delete("/permanentDeleteInternalmark/:id",commonInternalPermission,schoolAdminController.permanentDeleteInternalMark,);
router.get("/getClassWaiseTermMarksPdf",examPermission, reportController.getClassWaiseTermMarksPdf);

//staff attendance

router.post("/staffAttendance",attendancePermission, schoolAdminController.createStaffAttendance);
router.get("/staffAttendance",attendancePermission, schoolAdminController.getAllStaffAttendance);
router.get(
  "/staffAttendance/:id",attendancePermission,
  schoolAdminController.getStaffAttendanceById,
);
router.put("/staffAttendance/:id", attendancePermission,schoolAdminController.updateStaffAttendance);
router.delete(
  "/staffAttendance/:id",attendancePermission,
  schoolAdminController.deleteStaffAttendance,
);
router.post(
  "/bulkCreateStaffAttendance",attendancePermission,
  schoolAdminController.bulkCreateStaffAttendance,
);
router.get(
  "/staffAttendanceByDate",attendancePermission,
  schoolAdminController.getStaffAttendanceByDate,
);
//exam
router.post("/exams",examPermission, schoolAdminController.createExam);
router.put("/exams/:id", examPermission, schoolAdminController.editExam);
router.delete("/exams/:id", examPermission, schoolAdminController.deleteExam);
router.patch("/exams/:id/restore", examPermission, schoolAdminController.restoreExam);

router.get("/getExams", examPermission, schoolAdminController.getExams);
router.get(
  "/getExamMarksByExamId/:exam_id",
  examPermission,
  schoolAdminController.getExamMarksByExamId,
);
router.get(
  "/getMarksByInternalId/:id",
  examPermission,
  schoolAdminController.getMarksByInternalId,
);
router.put(
  "/updateExamPublishStatus/:id",
  examPermission,
  schoolAdminController.updateExamPublishStatus,
);

// Exam Timetables
router.post("/examTimetables", examPermission, schoolAdminController.createExamTimetable);
router.put("/examTimetables/:id", examPermission, schoolAdminController.updateExamTimetable);
router.get("/examTimetables", examPermission, schoolAdminController.getAllExamTimetables);
router.get("/examTimetables/:id", examPermission, schoolAdminController.getExamTimetableById);
router.delete("/examTimetables/:id", examPermission, schoolAdminController.deleteExamTimetable);
router.get("/getTrashedExamTimetables", examPermission, schoolAdminController.getTrashedExamTimetables);
router.patch("/restoreExamTimetable/:id", examPermission, schoolAdminController.restoreExamTimetable);
router.patch("/examTimetables/:id/restore", examPermission, schoolAdminController.restoreExamTimetable);
router.delete("/permanentDeleteExamTimetable/:id", examPermission, schoolAdminController.permanentDeleteExamTimetable);

//REPORTS

router.get("/invoiceReport",reportPermission, reportController.getInvoiceReport);
router.get("/paymentReport", reportPermission, reportController.getPaymentReport);
router.get("/attendanceReport", reportPermission, reportController.getAttendanceReport);
router.get("/homeworkReport", reportPermission, reportController.getHomeworkReport);
router.get(
  "/studentReport/:student_id",
  reportPermission,
  reportController.getStudentReportByStudentId,
);
router.get("/internalmarksReport", reportPermission, reportController.getInternalmarksReport);
router.get(
  "/getInternalmarkById/:id",
  schoolAdminController.getInternalmarkById,
);
router.get("/getHomeworkById/:id", schoolAdminController.getHomeworkById);
router.get("/getAttendanceById/:id", schoolAdminController.getAttendanceById);
// transportation routes
router.post(
  "/assignDriverToRoutes/:driverId",transportationPermission,
  schoolAdminController.assignDriverToRoutes,
);
router.post(
  "/assign-student-route",transportationPermission,
  upload.none(),
  schoolAdminController.assignStudentToRoute,
);
router.put(
  "/update-student-route/:route_id",transportationPermission,
  schoolAdminController.updateStudentToRoute,
);
router.delete(
  "/deleteStudentFromRoute/:route_id",
  transportationPermission,
  schoolAdminController.deleteStudentFromRoute,
);
router.put(
  "/updateVehicle/:id",transportationPermission,
  uploadWithErrorHandler(upload.fields([{ name: "photo", maxCount: 10 }])),
  storageUploadMiddleware("vehicles"),
  schoolAdminController.updateVehicle,
);

router.get(
  "/getDriversAssignedToRoutes",
  transportationPermission,
  schoolAdminController.getDriversAssignedToRoutes,
);
router.put("/updateIsLock/:route_id", transportationPermission,transportationPermission, schoolAdminController.updateIsLock);
router.get(
  "/getDriverLocation/:driver_id",transportationPermission,
  schoolAdminController.getDriverLocation,
);

/////////////////tracker//////////////////////////////////////

router.post(
  "/driver",transportationPermission,
  uploadWithErrorHandler(upload.fields([{ name: "photo", maxCount: 10 }])),
  storageUploadMiddleware("drivers"),
  schoolAdminController.createDriver,
);
router.post(
  "/vehicle",transportationPermission,
  uploadWithErrorHandler(upload.fields([{ name: "photo", maxCount: 10 }])),
  storageUploadMiddleware("vehicles"),
  schoolAdminController.createVehicle,
);
router.get("/getAllVehicles",transportationPermission, schoolAdminController.getAllVehicles);
router.get("/getVehicleById/:id", transportationPermission,schoolAdminController.getVehicleById);
router.delete("/deleteVehicle/:id", transportationPermission, schoolAdminController.deleteVehicle);
router.get("/getAllRoutes", transportationPermission, schoolAdminController.getAllRoutes);
router.get("/getDriverById/:id", transportationPermission, trackerController.getDriverById);
router.get("/getAllDrivers", transportationPermission, schoolAdminController.getAllDrivers);
router.put(
  "/updateDriverById/:id",
  uploadWithErrorHandler(upload.fields([{ name: "photo", maxCount: 10 }])),
  storageUploadMiddleware("drivers"),
  trackerController.updateDriverById,
);
router.delete("/deleteDriverById/:id", transportationPermission, trackerController.deleteDriverById);
router.post("/stop", schoolAdminController.createStop);
router.get("/getStopById/:id", transportationPermission, trackerController.getStopById);
router.delete("/deleteStop/:id", transportationPermission, trackerController.deleteStop);
router.post("/route", upload.none(), schoolAdminController.createRoute);
router.get("/getRouteById/:id", transportationPermission, trackerController.getRouteById);
router.put("/updateRouteById/:id", transportationPermission, trackerController.updateRouteById);
router.delete("/deleteRoute/:id", transportationPermission, trackerController.deleteRoute);
router.get(
  "/getDriverAssignedRoutes/:driverId",
  transportationPermission,
  trackerController.getDriverAssignedRoutesAdmin,
);

// Student Transfer routes
router.post("/studentTransfer", transportationPermission,transferController.adminCreateTransferRequest);
router.get(
  "/studentTransfer/outgoing",
  transportationPermission,
  transferController.adminGetOutgoingTransferRequests,
);
router.get(
  "/studentTransfer/incoming",
  transportationPermission,
  transferController.adminGetIncomingTransferRequests,
);
router.get(
  "/studentTransfer/:id",
  transportationPermission,
  transferController.adminGetTransferRequestById,
);
router.patch(
  "/studentTransfer/:id/review",
  transportationPermission,
  transferController.adminReviewTransferRequest,
);
router.delete(
  "/studentTransfer/:id",
  transportationPermission,
  transferController.adminDeleteTransferRequest,
);

router.get("/getSchoolsList", publicController.getSchoolsList);
//teacher controller
router.get("/getMyPermissions", teacherController.getMyPermissions);
//common Controller
router.get("/getAllDriverUsers",  transportationPermission,
 commonController.getAllDriverUsers);

router.get("/getLatestEvents", commonController.getLatestEvents);
router.get("/getLatestNews", commonController.getLatestNews);
router.get("/students/:id", commonController.getStudentDetailsById);

router.get(
  "/getHomeworkByStudentId/:student_id",homeworkPermission,
  commonController.getHomeworkByStudentId,
);
router.get(
  "/getAttendanceByStudentId/:student_id",studentsAttendancePermission,
  commonController.getAttendanceByStudentId,
);
router.get(
  "/getStudentAttendanceByDate/:student_id",studentsAttendancePermission,
  commonController.getStudentAttendanceByDate,
);
router.get("/allAchievements", achievementPermission,commonController.getAchievementsBySchool);
router.get(
  "/achievementByStudentId/:student_id",achievementPermission,
  commonController.achievementByStudentId,
);
router.get(
  "/getInternalMarkByStudentId/:student_id",
  internalMarksPermission,
  commonController.getInternalMarkByStudentId,
);

router.get(
  "/getLeaveRequestByStudentId/:student_id",
  leaveRequestPermission,
  commonController.getLeaveRequestByStudentId,
);
router.get("/getStaffsForFilter", commonController.getStaffsForFilter);
router.get("/getClassesByYear/:year", commonController.getClassesByYear);
router.get(
  "/getStudentsByClassId/:class_id",
  commonController.getStudentsByClassId,
);
router.get("/getMyPrfileAndSchoolDetails",commonController.getMyPrfileAndSchoolDetails);
router.get("/getLeaveTypes", commonController.getLeaveTypes);
router.get("/getExamTitles",commonController.getExamTitles);
router.put("/changePassword", commonController.changePassword);


module.exports = router;
