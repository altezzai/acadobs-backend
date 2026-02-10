const { Driver } = require("../../models");
const { StudentRoutes } = require("../../models");
const { stop: Stop } = require("../../models");
const { Student } = require("../../models");
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
    const user_id = req.user.user_id;

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


//create stop for driver
const createStopForDriver = async (req, res) => {
  try {
    const { route_id, stop_name, priority, latitude, longitude } = req.body;
    const user_id = req.user.user_id;

    if (!route_id || !stop_name) {
      return res.status(400).json({ message: "Fields are missing" });
    }
    const driver = await Driver.findOne({
      where: {
        user_id,
        trash: false,
      },
    });


    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const route = await StudentRoutes.findOne({
      where: {
        id: route_id,
        trash: false,
      },
      include: [
        {
          model: Driver,
          as: "drivers",
          where: { id: driver.id },
          through: { attributes: [] },
        },
      ],
    });

    const existingStop = await Stop.findOne({
      where: {
        route_id,
        stop_name,
        trash: false,
      },
    });

    // Create stop
    const stop = await Stop.create({
      route_id,
      stop_name,
      priority,
      latitude,
      longitude,
      trash: false,
    });

    res.status(201).json({
      message: "Stop created successfully",
      stop,
    });
  } catch (error) {
    console.error("Error creating stop:", error);
    res.status(500).json({ error: "Failed to create stop" });
  }
};


// driver assigns student to a stop
const assignStudentsToStop = async (req, res) => {
  try {
    const { student_ids, stop_id } = req.body;
    const user_id = req.user.user_id;

    if (!Array.isArray(student_ids) || student_ids.length === 0 || !stop_id) {
      return res.status(400).json({
        message: "student_ids (array) and stop_id are required",
      });
    }


    const driver = await Driver.findOne({
      where: { user_id, trash: false },
    });

    if (!driver) {
      return res.status(403).json({
        message: "Driver profile not found",
      });
    }


    const stop = await Stop.findOne({
      where: { id: stop_id, trash: false },
      include: [
        {
          model: StudentRoutes,
          as: "route",
          include: [
            {
              model: Driver,
              as: "drivers",
              where: { id: driver.id },
              attributes: [],
            },
          ],
        },
      ],
    });

    if (!stop) {
      return res.status(404).json({
        message: "Stop not found or not assigned to this driver",
      });
    }


    const students = await Student.findAll({
      where: {
        id: student_ids,
        trash: false,
      },
    });

    if (students.length !== student_ids.length) {
      return res.status(404).json({
        message: "One or more students not found",
      });
    }


    await Student.update(
      {
        stop_id: stop_id,
        route_id: stop.route_id,
      },
      {
        where: { id: student_ids },
      }
    );

    return res.status(200).json({
      message: "Students assigned to stop successfully",
      assigned_count: students.length,
    });
  } catch (error) {
    console.error("Error assigning students to stop:", error);
    res.status(500).json({
      error: "Failed to assign students to stop",
    });
  }
};

//driver creates route
const createRouteForDriver = async (req, res) => {
  try {
    const { route_name, vehicle_id, type } = req.body;
    const user_id = req.user.user_id;

    if (!route_name || !vehicle_id || !type) {
      return res.status(400).json({ message: "Fields are missing" });
    }
    const driver = await Driver.findOne({
      where: {
        user_id,
        trash: false,
      },
    });


    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const route = await StudentRoutes.create({
      route_name,
      vehicle_id,
      type,
      trash: false,
    });

    res.status(201).json({
      message: "Route created successfully",
      route,
    });
  } catch (error) {
    console.error("Error creating route:", error);
    res.status(500).json({ error: "Failed to create route" });
  }
};


module.exports = {
  getDriverById,
  updateDriverById,
  deleteDriverById,
  getDriverAssignedRoutes,
  DriverAssignedRoutes,
  createStopForDriver,
  assignStudentsToStop,
  createRouteForDriver,
};
