const express = require("express");
const router = express.Router();
const { upload, uploadWithErrorHandler } = require("../middlewares/upload");
const superAdminController = require("../controllers/superAdminController");
const schoolAdminController = require("../controllers/schoolAdminController");
const schoolUploads = [
  { name: "image", maxCount: 1 },
  { name: "logo", maxCount: 1 },
];

router.post(
  "/schools",
  uploadWithErrorHandler(upload.fields(schoolUploads)),
  superAdminController.createSchool
);
router.get("/schools", superAdminController.getAllSchools);
router.put(
  "/schools/:id",
  uploadWithErrorHandler(upload.fields(schoolUploads)),
  superAdminController.updateSchool
);
router.delete("/schools/:id", superAdminController.deleteSchool);
router.get("/schools/trashed", superAdminController.getTrashedSchools);
router.get("/schools/:id", superAdminController.getSchoolById);
router.patch("/schools/:id/restore", superAdminController.restoreSchool);
router.delete(
  "/schools/:id/permanent",
  superAdminController.permanentlyDeleteSchool
);

//class
// Class routes
router.post("/classes", superAdminController.createClass); // Create a new class
router.get("/classes", superAdminController.getAllClasses); // Get all classes
router.get("/classes/trashed", superAdminController.getTrashedClasses);
router.get("/classes/:id", superAdminController.getClassById); // Get single class by ID
router.put("/classes/:id", superAdminController.updateClass); // Update a class
router.delete("/classes/:id", superAdminController.deleteClass); // Soft delete a class
router.patch("/classes/:id/restore", superAdminController.restoreClass); // Restore a deleted class
router.delete(
  "/classes/:id/permanent",
  superAdminController.permanentDeleteClass
); // Permanently delete a class

// Subject routes
router.post("/subjects", superAdminController.createSubject);
router.get("/subjects", superAdminController.getSubjects);
router.get("/subjects/trashed", superAdminController.getTrashedSubjects);
router.get("/subjects/:id", superAdminController.getSubjectById);
router.put("/subjects/:id", superAdminController.updateSubject);
router.delete("/subjects/:id", superAdminController.deleteSubject);
router.patch("/subjects/:id/restore", superAdminController.restoreSubject);
router.delete(
  "/subjects/:id/permanent",
  superAdminController.permanentlyDeleteSubject
);

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
router.get("/syllabus/trashed", superAdminController.getTrashedSyllabuses);
router.get("/syllabus/:id", superAdminController.getSyllabusById);
router.put("/syllabus/:id", superAdminController.updateSyllabus);
router.delete("/syllabus/:id", superAdminController.deleteSyllabus);
router.patch("/syllabus/:id/restore", superAdminController.restoreSyllabus);
router.delete(
  "/syllabus/:id/permanent",
  superAdminController.permanentlyDeleteSyllabus
);
module.exports = router;
