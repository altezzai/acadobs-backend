const express = require("express");
const router = express.Router();
const { dpUpload } = require("../middlewares/upload");
const superAdminController = require("../controllers/superAdminController");
const schoolAdminController = require("../controllers/schoolAdminController");

router.post(
  "/schools",
  dpUpload.single("logo"),
  superAdminController.createSchool
);
router.get("/schools", superAdminController.getAllSchools);
router.put(
  "/schools/:id",
  dpUpload.single("logo"),
  superAdminController.updateSchool
);
router.delete("/schools/:id", superAdminController.deleteSchool);

//class
// Class routes
router.post("/classes", superAdminController.createClass); // Create a new class
router.get("/classes", superAdminController.getAllClasses); // Get all classes
router.get("/classes/:id", superAdminController.getClassById); // Get single class by ID
router.put("/classes/:id", superAdminController.updateClass); // Update a class
router.delete("/classes/:id", superAdminController.deleteClass); // Soft delete a class

// Subject routes
router.post("/subjects", superAdminController.createSubject);
router.get("/subjects", superAdminController.getSubjects);
router.get("/subjects/:id", superAdminController.getSubjectById);
router.put("/subjects/:id", superAdminController.updateSubject);
router.delete("/subjects/:id", superAdminController.deleteSubject);

module.exports = router;
