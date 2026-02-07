const express = require("express");
const router = express.Router();
const trackerController = require("../controllers/tracker/trackerController");

router.get("/getDriverAssignedRoutes", trackerController.DriverAssignedRoutes);
module.exports = router;