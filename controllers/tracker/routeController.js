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
    const { start, stop, route_no, type, vehicle_id, driver_id, isLock } = req.body;
    const pickupRoute = await StudentRoutes.findOne({
      where: {
        id: id,
      },
    });
    if (!pickupRoute) {
      return res.status(404).json({ message: "No route found" });
    }

    const pickupRouteName = route_no
      ? `${start}-${stop}-${route_no}`
      : `${start}-${stop}`;

    const dropRouteName = route_no
      ? `${stop}-${start}-${route_no}`
      : `${stop}-${start}`;

    await pickupRoute.update({
      route_name: pickupRouteName ?? pickupRoute.route_name,
      vehicle_id: vehicle_id ?? pickupRoute.vehicle_id,
      driver_id: driver_id ?? pickupRoute.driver_id,
      type: type ?? pickupRoute.type,
      isLock: isLock ?? pickupRoute.isLock,
    });

    const dropRoute = await StudentRoutes.findOne({
      where: { pickId: pickupRoute.id }
    });

    if (dropRoute) {
      await dropRoute.update({
        route_name: dropRouteName,
        vehicle_id: vehicle_id ?? dropRoute.vehicle_id,
        driver_id: driver_id ?? dropRoute.driver_id,
        isLock: isLock ?? dropRoute.isLock,
      });
    }

    return res.status(200).json({
      message: "Stop updated successfully",
      data: pickupRouteName, dropRouteName
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
