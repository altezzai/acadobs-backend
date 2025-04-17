const express = require("express");
const router = express.Router();
const schoolAdminController = require("../controllers/schoolAdminController");
const { dpUpload, nUpload } = require("../middlewares/upload");
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

const upload = multer({ storage });
// Class routes
router.post("/classes", schoolAdminController.createClass); // Create a new class
router.get("/classes", schoolAdminController.getAllClasses); // Get all classes
router.get("/classes/:id", schoolAdminController.getClassById); // Get single class by ID
router.put("/classes/:id", schoolAdminController.updateClass); // Update a class
router.delete("/classes/:id", schoolAdminController.deleteClass); // Soft delete a class

// Subject routes
router.post("/subjects", schoolAdminController.createSubject);
router.get("/subjects", schoolAdminController.getSubjects);
router.put("/subjects/:id", schoolAdminController.updateSubject);
router.delete("/subjects/:id", schoolAdminController.deleteSubject);

//staff routes
router.post(
  "/staffs",
  dpUpload.single("dp"),
  schoolAdminController.createStaff
);
router.get("/staffs", schoolAdminController.getAllStaff);
router.get("/staffs", schoolAdminController.getAllStaff);
router.get("/staffs/:staff_id", schoolAdminController.getStaffById);
router.put(
  "/staffs/:staff_id",
  dpUpload.single("dp"),
  schoolAdminController.updateStaff
);
router.put(
  "/updateStaffUser/:user_id",
  dpUpload.single("dp"),
  schoolAdminController.updateStaffUser
);
router.delete("/staffs/:staff_id", schoolAdminController.deleteStaff);
router.patch("/staffs/:staff_id", schoolAdminController.restoredStaff);

// Guardian routes
router.post(
  "/guardian",
  dpUpload.single("dp"),
  schoolAdminController.createGuardian
);
router.get("/guardian", schoolAdminController.getAllGuardians);
router.get("/guardian/:id", schoolAdminController.getGuardianById);
router.put("/guardian/:id", schoolAdminController.updateGuardian);
router.delete("/guardian/:id", schoolAdminController.deleteGuardian);

// Student routes
router.post(
  "/students",
  dpUpload.fields([
    { name: "dp", maxCount: 1 }, // guardian image
    { name: "image", maxCount: 1 }, // student image
  ]),
  schoolAdminController.createStudent
);
router.get("/students", schoolAdminController.getAllStudents);
router.get("/students/:id", schoolAdminController.getStudentById);
router.put(
  "/students/:id",
  dpUpload.single("image"),
  schoolAdminController.updateStudent
);
router.delete("/students/:id", schoolAdminController.deleteStudent);
//duty
router.post(
  "/duties",
  dpUpload.single("file"),
  schoolAdminController.createDutyWithAssignments
);
router.get("/duties", schoolAdminController.getAllDuties);
router.get("/duties/:id", schoolAdminController.getDutyById);
router.put(
  "/duties/:id",
  dpUpload.single("file"),
  schoolAdminController.updateDuty
);
router.delete("/duties/:id", schoolAdminController.deleteDuty);
router.patch("/duties/:id", schoolAdminController.restoreDuty);
router.delete(
  "/permanentDeleteDuty/:id",
  schoolAdminController.permanentDeleteDuty
);
router.put(
  "/updateDutyAssigned/:id",
  dpUpload.single("solved_file"),
  schoolAdminController.updateDutyAssigned
);
router.put(
  "/bulkUpdateDutyAssignments/",
  schoolAdminController.bulkUpdateDutyAssignments
);
router.post(
  "/achievements",
  dpUpload.any(),
  schoolAdminController.createAchievementWithStudents
);
router.get(
  "/getAllAchievementsBySchoolId/:id",
  schoolAdminController.getAllAchievementsBySchoolId
);
router.get("/achievements/:id", schoolAdminController.getAchievementById);
router.put("/achievements/:id", schoolAdminController.updateAchievement);
router.delete("/achievements/:id", schoolAdminController.deleteAchievement);
router.patch("/achievements/:id", schoolAdminController.restoreAchievement);
router.put(
  "/updateStudentAchievement/:id",
  dpUpload.single("proof_document"),
  schoolAdminController.updateStudentAchievement
);
//events
router.post(
  "/events",
  dpUpload.single("file"),
  schoolAdminController.createEvent
);
router.get("/events", schoolAdminController.getAllEvents);
router.get("/events/:id", schoolAdminController.getEventById);
router.put(
  "/events/:id",
  dpUpload.single("file"),
  schoolAdminController.updateEvent
);
router.delete("/events/:id", schoolAdminController.deleteEvent);
router.patch("/events/:id", schoolAdminController.restoreEvent);
//payment
router.post("/payments", schoolAdminController.createPayment);
router.get("/payments", schoolAdminController.getAllPayments);
router.get("/payments/:id", schoolAdminController.getPaymentById);
router.put("/payments/:id", schoolAdminController.updatePayment);
router.delete("/payments/:id", schoolAdminController.deletePayment);
router.patch("/payments/:id", schoolAdminController.restorePayment);

//leave request
router.post(
  "/leaveRequest",
  dpUpload.single("attachment"),
  schoolAdminController.createLeaveRequest
);
router.get("/leaveRequest", schoolAdminController.getAllLeaveRequests);
router.get("/leaveRequest/:id", schoolAdminController.getLeaveRequestById);
router.delete("/leaveRequest/:id", schoolAdminController.deleteLeaveRequest);
router.patch("/leaveRequest/:id", schoolAdminController.restoreLeaveRequest);
router.put(
  "/leaveRequest/:id",
  dpUpload.single("attachment"),
  schoolAdminController.updateLeaveRequest
);
router.patch(
  "/leaveRequestpermission/:id",
  schoolAdminController.leaveRequestPermission
);
//news
router.post(
  "/news",
  dpUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  schoolAdminController.createNews
);

router.get("/news", schoolAdminController.getAllNews);
router.get("/news/:id", schoolAdminController.getNewsById);
router.put(
  "/news/:id",
  dpUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  schoolAdminController.updateNews
);
router.delete("/news/:id", schoolAdminController.deleteNews);
router.patch("/news/:id", schoolAdminController.restoreNews);
router.delete("/deleteNewsImage/:id", schoolAdminController.deleteNewsImage);

module.exports = router;
