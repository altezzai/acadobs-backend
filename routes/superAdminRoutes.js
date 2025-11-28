const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/upload");
const superAdminController = require("../controllers/superAdminController");
const schoolAdminController = require("../controllers/schoolAdminController");

router.post(
  "/schools",
  upload.single("logo"),
  superAdminController.createSchool
);
router.get("/schools", superAdminController.getAllSchools);
router.put(
  "/schools/:id",
  upload.single("logo"),
  superAdminController.updateSchool
);
router.delete("/schools/:id", superAdminController.deleteSchool);
router.get("/schools/:id", superAdminController.getSchoolById);
router.patch("/schools/:id/restore", superAdminController.restoreSchool);
router.delete(
  "/schools/:id/permanent",
  superAdminController.permanentlyDeleteSchool
);
router.get("/schools/trashed", superAdminController.getTrashedSchools);

//class
// Class routes
router.post("/classes", superAdminController.createClass); // Create a new class
router.get("/classes", superAdminController.getAllClasses); // Get all classes
router.get("/classes/:id", superAdminController.getClassById); // Get single class by ID
router.put("/classes/:id", superAdminController.updateClass); // Update a class
router.delete("/classes/:id", superAdminController.deleteClass); // Soft delete a class
router.patch("/classes/:id/restore", superAdminController.restoreClass); // Restore a deleted class
router.delete(
  "/classes/:id/permanent",
  superAdminController.permanentDeleteClass
); // Permanently delete a class
router.get("/classes/trashed", superAdminController.getTrashedClasses);

// Subject routes
router.post("/subjects", superAdminController.createSubject);
router.get("/subjects", superAdminController.getSubjects);
router.get("/subjects/:id", superAdminController.getSubjectById);
router.put("/subjects/:id", superAdminController.updateSubject);
router.delete("/subjects/:id", superAdminController.deleteSubject);
router.patch("/subjects/:id/restore", superAdminController.restoreSubject);
router.delete(
  "/subjects/:id/permanent",
  superAdminController.permanentlyDeleteSubject
);
router.get("/subjects/trashed", superAdminController.getTrashedSubjects);

// Account Delete Request routes
router.get(
  "/accountDeleteRequests",
  superAdminController.getAccountDeleteRequests
);
router.put(
  "/updateAccountDeleteRequests/:id",
  superAdminController.updateAccountDeleteRequests
);

// Syllabus routes
router.post("/syllabus", superAdminController.createSyllabus);
router.get("/syllabus", superAdminController.getSyllabuses);
router.get("/syllabus/:id", superAdminController.getSyllabusById);
router.put("/syllabus/:id", superAdminController.updateSyllabus);
router.delete("/syllabus/:id", superAdminController.deleteSyllabus);
router.patch("/syllabus/:id/restore", superAdminController.restoreSyllabus);
router.delete(
  "/syllabus/:id/permanent",
  superAdminController.permanentlyDeleteSyllabus
);
router.get("/syllabus/trashed", superAdminController.getTrashedSyllabuses);
module.exports = router;
