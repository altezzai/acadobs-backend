const express = require("express");
const router = express.Router();
const trackerController = require("../controllers/tracker/trackerController");

router.get("/getDriverAssignedRoutes", trackerController.DriverAssignedRoutes);
router.post("/createStopForDriver", trackerController.createStopForDriver);
router.post("/assignStudentToStop", trackerController.assignStudentsToStop);
router.get("/getMyStudents/:route_id", trackerController.getMyStudents);
// router.post("/createRouteForDriver", trackerController.createRouteForDriver);
module.exports = router;