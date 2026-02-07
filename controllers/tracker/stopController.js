const { stop } = require("../../models");

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

module.exports = { getStopById, updateStopById, deleteStop };
