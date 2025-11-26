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

// Account Delete Request routes
router.get(
  "/accountDeleteRequests",
  superAdminController.getAccountDeleteRequests
);
router.put(
  "/updateAccountDeleteRequests/:id",
  superAdminController.updateAccountDeleteRequests
);

module.exports = router;
