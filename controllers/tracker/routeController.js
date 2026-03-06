const { StudentRoutes, Student, Guardian, StudentRouteAssignment, Driver } = require("../../models");

//getRouteById
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentroute = await StudentRoutes.findOne({
      where: { id },
      attributes: ["id", "route_name", "vehicle_id", "type"],
      include: [
        {
          model: Driver,
          as: "drivers",
          attributes: ["name"],
        },
        {
          model: Student,
          as: "students",
          attributes: [
            "id",
            "class_id",
            "reg_no",
            "full_name",
            "address",
          ],
          through: {
            model: StudentRouteAssignment,
            attributes: [],
            where: { trash: false },
          },
          include: [
            {
              model: Guardian,
              as: "guardian",
              attributes: ["id", "guardian_name", "guardian_contact"],
            },
          ],
        },
      ],
    });
    if (!studentroute) {
      return res.status(404).json({ message: "No route found" });
    }

    const result = {
      id: studentroute.id,
      route_name: studentroute.route_name,
      vehicle_id: studentroute.vehicle_id,
      type: studentroute.type,

      driver: studentroute.drivers?.[0]?.name || null,

      students: studentroute.students?.map(student => ({
        id: student.id,
        class_id: student.class_id,
        reg_no: student.reg_no,
        full_name: student.full_name,
        address: student.address,
        guardian: student.guardian
          ? {
            id: student.guardian.id,
            guardian_name: student.guardian.guardian_name,
            guardian_contact: student.guardian.guardian_contact,
          }
          : null
      })) ?? []
    };
    return res
      .status(200)
      .json({ message: "Route fetched successfully", data: result });
  } catch (error) {
    console.log("Error has occured: ", error);
    return res.status(500).json({ error: "Failed to fetch route" });
  }
};

//update route
const updateRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const { start, stop, route_no, vehicle_id, driver_id, isLock, hasDropRoute } = req.body;
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
      type: "PICKUP",
      isLock: isLock ?? pickupRoute.isLock,
    });
    if (driver_id) {
      await pickupRoute.setDrivers(Array.isArray(driver_id) ? driver_id : [driver_id]);
    }

    const dropRoute = await StudentRoutes.findOne({
      where: { pickId: pickupRoute.id }
    });

    if (dropRoute) {
      await dropRoute.update({
        route_name: dropRouteName,
        vehicle_id: vehicle_id ?? dropRoute.vehicle_id,
        type: "DROP",
        isLock: isLock ?? dropRoute.isLock,
      });
      if (driver_id) {
        await dropRoute.setDrivers(Array.isArray(driver_id) ? driver_id : [driver_id]);
      }

    }
    //creates drop route if not exists
    if (hasDropRoute && !dropRoute) {
      const newDropRoute = await StudentRoutes.create({
        route_name: dropRouteName,
        vehicle_id: vehicle_id ?? pickupRoute.vehicle_id,
        type: "DROP",
        pickId: pickupRoute.id,
        isLock: isLock ?? pickupRoute.isLock,
      });

      if (driver_id) {
        await newDropRoute.setDrivers(
          Array.isArray(driver_id) ? driver_id : [driver_id]
        );
      }
    }

    return res.status(200).json({
      message: "Route updated successfully",
      data: { pickupRouteName, dropRouteName }
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
