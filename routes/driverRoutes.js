const express = require("express");
const router = express.Router();
const trackerController = require("../controllers/trackerController");
const { route } = require("./schoolAdminRoutes");


router.get("/getDriverAssignedRoutes", trackerController.DriverAssignedRoutes);
router.post("/createStopForDriver", trackerController.createStopForDriver);
router.post("/assignStudentToStop", trackerController.assignStudentsToStop);
router.get("/getStudentsWithUnassignedStopsByRouteId/:route_id", trackerController.getStudentsWithUnassignedStopsByRouteId);
router.get("/getStopsForDriver/:route_id", trackerController.getStopsForDriverByRouteId);
router.get("/getStopDetailsForDriver/:stop_id", trackerController.getStopDetailsForDriver);
router.post("/updateRouteActive", trackerController.updateRouteActive);
router.put("/updateStopandStudent", trackerController.updateStopandStudent);
router.put("/editStudentsStopStatus/:id", trackerController.editStudentsStopStatus);
router.post("/routeInactive", trackerController.routeInactive);
router.put("/updateStopForDriver/:stopId", trackerController.updateStopForDriver);
router.delete("/deleteStudentFromStop/:stop_id/:student_id", trackerController.deleteStudentFromStop);
// router.post("/bulkStopCreation", trackerController.bulkStopCreation);
router.put("/bulkchangeStopPrioritybyRouteId/:route_id", trackerController.bulkchangeStopPrioritybyRouteId);
router.post("/updateLiveLocation", trackerController.updateLiveLocation);
router.get("/getTrackedDataWithDateByRouteId/:route_id", trackerController.getTrackedDataWithDateByRouteId);

// router.post("/createRouteForDriver", trackerController.createRouteForDriver);
module.exports = router;