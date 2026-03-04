const { stop, Driver, StudentRoutes } = require("../../models");

// getStopById
const getStopById = async (req, res) => {
  try {
    const { id } = req.params;

    const studentStop = await stop.findOne({
      where: {
        id,
        trash: false,
      },
      attributes: ["route_id", "stop_name", "longitude", "latitude"],
    });

    if (!stop) {
      return res.status(404).json({
        message: "Stop not found",
      });
    }

    return res.status(200).json({
      message: "Stop fetched successfully",
      data: studentStop,
    });
  } catch (error) {
    console.error("Error fetching stop:", error);
    return res.status(500).json({
      error: "Failed to fetch stop",
    });
  }
};

//updateStopById
const updateStopById = async (req, res) => {
  try {
    const { id } = req.params;
    const { stop_name, longitude, latitude } = req.body;
    const studentStop = await stop.findOne({
      where: {
        id,
        trash: false,
      },
    });

    if (!studentStop) {
      return res.status(404).json({
        message: "Stop not found",
      });
    }
    await studentStop.update({
      stop_name: stop_name ?? studentStop.stop_name,
      longitude: longitude ?? studentStop.longitude,
      latitude: latitude ?? studentStop.latitude,
    });

    return res.status(200).json({
      message: "Stop updated successfully",
      data: studentStop,
    });
  } catch (error) {
    console.error("Error updating stop:", error);
    return res.status(500).json({
      error: "Failed to update stop",
    });
  }
};

//update stop for driver if the isLock in route is false
const updateStopForDriver = async (req, res) => {
  try {
    const { stopId } = req.params;
    const driverId = req.user.user_id;
    const { stop_name, longitude, latitude, priority } = req.body;
    const driverData = await Driver.findOne({
      where: {
        user_id: driverId,
        trash: false,
      },
    });

    if (!driverData) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    const stopData = await stop.findOne({
      where: {
        id: stopId,
        trash: false,
      },
      include: [
        {
          model: StudentRoutes,
          as: "route",
          attributes: ["id", "isLock"],
        },
      ],
    });

    if (!stopData) {
      return res.status(404).json({
        message: "Stop not found",
      });
    }

    if (stopData.route?.isLock === true) {
      return res.status(403).json({
        message: "This route is locked. You cannot edit stops.",
      });
    }
    await stopData.update({
      stop_name: stop_name ?? stopData.stop_name,
      longitude: longitude ?? stopData.longitude,
      latitude: latitude ?? stopData.latitude,
      priority: priority ?? stopData.priority,
    });

    return res.status(200).json({
      message: "Stop updated successfully",
      stop: stopData,
    });

  } catch (error) {
    console.log("error in updating stop for driver", error);
    return res.status(500).json({
      error: "Failed to update stop for driver",
    });
  }
};

//deleteStop
const deleteStop = async (req, res) => {
  try {
    const { id } = req.params;
    const studentStop = await stop.findOne({
      where: {
        id,
        trash: false,
      },
    });

    if (!studentStop) {
      return res.status(404).json({
        message: "Stop not found",
      });
    }
    await studentStop.update({ trash: true });
    res.status(200).json({ message: "Stop deleted successfully" });
  } catch (error) {
    console.log("error in deleting stop", error);
  }
};

module.exports = { getStopById, updateStopById, deleteStop, updateStopForDriver };
