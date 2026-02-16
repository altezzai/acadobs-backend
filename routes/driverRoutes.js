const express = require("express");
const router = express.Router();
const trackerController = require("../controllers/tracker/trackerController");

router.get("/getDriverAssignedRoutes", trackerController.DriverAssignedRoutes);
router.post("/createStopForDriver", trackerController.createStopForDriver);
router.post("/assignStudentToStop", trackerController.assignStudentsToStop);
router.get("/getMyStudents/:route_id", trackerController.getMyStudents);
router.get("/getStopsForDriver/:route_id", trackerController.getStopsForDriver);
router.get("/getStopDetailsForDriver/:stop_id", trackerController.getStopDetailsForDriver);
router.post("/updateRouteActive", trackerController.updateRouteActive);
router.post("/updateStopandStudent", trackerController.updateStopandStudent);
// router.post("/createRouteForDriver", trackerController.createRouteForDriver);
module.exports = router;