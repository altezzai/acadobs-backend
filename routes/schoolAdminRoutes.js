const express = require("express");
const router = express.Router();
const schoolAdminController = require("../controllers/schoolAdminController");
const { dpUpload } = require("../middlewares/upload");
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
module.exports = router;
