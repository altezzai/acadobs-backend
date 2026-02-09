const express = require("express");
const router = express.Router();
const trackerController = require("../controllers/tracker/trackerController");

router.get("/getDriverAssignedRoutes", trackerController.DriverAssignedRoutes);
router.post("/createStopForDriver", trackerController.createStopForDriver);
router.post("/assignStudentToStop", trackerController.assignStudentToStop);
module.exports = router;