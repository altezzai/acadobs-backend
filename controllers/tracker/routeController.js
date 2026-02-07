const { StudentRoutes } = require("../../models");

//getRouteById
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentroute = await StudentRoutes.findOne({
      where: {
        id: id,
      },
      attributes: ["route_name", "vehicle_id", "type"],
    });
    if (!studentroute) {
      return res.status(404).json({ message: "No route found" });
    }
    return res
      .status(200)
      .json({ message: "Route fetched successfully", data: studentroute });
  } catch (error) {
    console.log("Error has occured: ", error);
  }
};

//update route
const updateRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const { route_name, type } = req.body;
    const studentroute = await StudentRoutes.findOne({
      where: {
        id: id,
      },
    });
    if (!studentroute) {
      return res.status(404).json({ message: "No route found" });
    }

    await studentroute.update({
      route_name: route_name ?? studentroute.route_name,
      type: type ?? studentroute.type,
    });

    return res.status(200).json({
      message: "Stop updated successfully",
      data: studentroute,
    });
  } catch (error) {
    console.error("Error updating route:", error);
    return res.status(500).json({
      error: "Failed to update route",
    });
  }
};

//delete route
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const studentroute = await StudentRoutes.findOne({
      where: {
        id: id,
      },
    });
    if (!studentroute) {
      return res.status(404).json({ message: "No route found" });
    }
    await studentroute.update({ trash: true });
    res.status(200).json({ message: "Route deleted successfully" });
  } catch (error) {
    console.error("Error deleting route:", error);
    return res.status(500).json({
      error: "Failed to delete route",
    });
  }
};
module.exports = {
  getRouteById,
  updateRouteById,
  deleteRoute,
};
