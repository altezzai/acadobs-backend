const { Driver } = require("../../models");
const { StudentRoutes } = require("../../models");

// getDriverById
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findOne({
      where: {
        id,
        trash: false,
      },
      attributes: ["id", "name", "phone", "email", "photo"],
    });

    if (!driver) {
      return res.status(404).json({
        error: "Driver not found",
      });
    }

    return res.status(200).json({
      message: "Fetched successfully",
      data: driver,
    });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return res.status(500).json({
      error: "Failed to fetch driver",
    });
  }
};

//updateById
const updateDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, photo, email } = req.body;
    const driver = await Driver.findOne({
      where: {
        id,
        trash: false,
      },
    });
    if (!driver) {
      return res.status(404).json({
        error: "Driver not found",
      });
    }
    await driver.update({
      name: name ?? driver.name,
      phone: phone ?? driver.phone,
      email: email ?? driver.email,
      photo: photo ?? driver.photo,
    });

    return res.status(200).json({
      message: "Driver updated successfully",
      data: driver,
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    return res.status(500).json({
      error: "Failed to update driver",
    });
  }
};

//deleteDriverById
const deleteDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findOne({
      where: {
        id,
        trash: false,
      },
    });

    await Driver.update({ trash: true });
    res.status(200).json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.log("Error in deleting driver: ", error);
  }
};

//admin sees driver assinged routes
const getDriverAssignedRoutes = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findOne({
      where: {
        id: driverId,
        trash: false,
      },
      attributes: ["id", "name", "phone"],
      include: [
        {
          model: StudentRoutes,
          as: "routes",
          attributes: ["id", "route_name", "vehicle_id", "type"],
          through: {
            attributes: [],
          },
        },
      ],
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    return res.status(200).json({
      message: "Assigned routes fetched successfully",
      data: driver.routes,
    });
  } catch (error) {
    console.error("Error fetching driver routes:", error);
    return res.status(500).json({
      error: "Failed to fetch assigned routes",
    });
  }
};

//driver sees thier assigned routes
const DriverAssignedRoutes = async (req, res) => {
  try {
    const user_id = req.user.id;

    const driver = await Driver.findOne({
      where: {
        user_id,
        trash: false,
      },
      attributes: ["name", "phone"],
      include: [
        {
          model: StudentRoutes,
          as: "routes",
          attributes: ["id", "route_name", "vehicle_id", "type"],
          through: {
            attributes: [],
          },
        },
      ],
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
      });
    }

    return res.status(200).json({
      message: "Assigned routes fetched successfully",
      data: driver.routes,
    });
  } catch (error) {
    console.error("Error fetching driver routes:", error);
    return res.status(500).json({
      error: "Failed to fetch assigned routes",
    });
  }
};

//assign drivers to routes
const assignDriverToRoutes = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { routeIds } = req.body;

    if (!Array.isArray(routeIds) || routeIds.length === 0) {
      return res.status(400).json({
        message: "routeIds must be a non-empty array",
      });
    }

    // check driver
    const driver = await Driver.findOne({
      where: { id: driverId, trash: false },
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    // check routes
    const routes = await StudentRoutes.findAll({
      where: {
        id: routeIds,
      },
    });

    if (routes.length !== routeIds.length) {
      return res.status(404).json({
        message: "One or more routes not found",
      });
    }

    await driver.addRoutes(routeIds);

    return res.status(200).json({
      message: "Driver assigned to routes successfully",
    });
  } catch (error) {
    console.error("Error assigning driver to routes:", error);
    return res.status(500).json({
      error: "Failed to assign driver to routes",
    });
  }
};

module.exports = {
  getDriverById,
  updateDriverById,
  deleteDriverById,
  getDriverAssignedRoutes,
  assignDriverToRoutes,
  DriverAssignedRoutes,
};
