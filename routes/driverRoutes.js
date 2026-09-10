const express = require("express");
const router = express.Router();
const trackerController = require("../controllers/trackerController");
const { route } = require("./schoolAdminRoutes");


router.get("/getDriverAssignedRoutes", trackerController.DriverAssignedRoutes);
router.get("/getUnAssignedStopsInPairRouteByRouteId/:route_id", trackerController.getUnAssignedStopsInPairRouteByRouteId);
router.get("/getStudentsWithUnassignedStopsByRouteId/:route_id", trackerController.getStudentsWithUnassignedStopsByRouteId);
router.post("/assignedStopIdsFromPairRoute/:route_id", trackerController.assignedStopIdsFromPairRoute);
router.post("/updateRouteActive", trackerController.updateRouteActive);
router.get("/getStudentsByRouteId/:route_id", trackerController.getStudentsByRouteId);

router.post("/assignStudentToStop", trackerController.assignStudentsToStop);
router.post("/createStopForDriver", trackerController.createStopForDriver);
router.get("/getStopsForDriver/:route_id", trackerController.getStopsForDriverByRouteId);
router.get("/getStopDetailsForDriver/:stop_id", trackerController.getStopDetailsForDriver);
router.put("/updateStopandStudent", trackerController.updateStopandStudent);
router.put("/editStudentsStopStatus/:id", trackerController.editStudentsStopStatus);
router.post("/routeInactive", trackerController.routeInactive);
router.put("/updateStopForDriver/:stopId", trackerController.updateStopForDriver);
router.put("/bulkchangeStopPrioritybyRouteId/:route_id", trackerController.bulkchangeStopPrioritybyRouteId);
router.delete("/deleteStopById/:id", trackerController.deleteStopById);
router.delete("/deleteStudentFromStop/:stop_id/:student_id", trackerController.deleteStudentFromStop);

router.post("/updateLiveLocation", trackerController.updateLiveLocation);
router.get("/getTrackedDataWithDateByRouteId/:route_id", trackerController.getTrackedDataWithDateByRouteId);

module.exports = router;