const { where } = require("sequelize");
const { Driver, Guardian } = require("../../models");
const { StudentRoutes } = require("../../models");
const { stop: Stop } = require("../../models");
const { Student } = require("../../models");
const StudentRouteAssignment = require("../../models/student_route_assignment");
const { Sequelize } = require("sequelize");
const { compressAndSaveFile } = require("../../utils/fileHandler");
const { Op } = require("sequelize");
// getDriverById
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const driver = await Driver.findOne({
      where: {
        id,
        trash: false,
        school_id: school_id,
      },
      attributes: ["id", "name", "phone", "email", "photo", "address"],
      include: [
        {
          model: StudentRoutes,
          as: "routes",
          attributes: ["id", "route_name", "vehicle_id", "type", "active", "activated_at"],
          through: {
            attributes: [],
          },
        },
      ],
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
    const school_id = req.user.school_id;
    const { name, phone, email, address } = req.body || {};

    let photoPath = undefined;
    if (req.file) {
      const uploadPath = "uploads/driver_images/";
      photoPath = await compressAndSaveFile(req.file, uploadPath);
    }
    const driver = await Driver.findOne({
      where: {
        id,
        trash: false,
        school_id: school_id,
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
      address: address ?? driver.address,
      photo: photoPath ?? driver.photo,
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
    const school_id = req.user.school_id;
    const { id } = req.params;
    const driver = await Driver.findOne({
      where: {
        id: id,
        school_id: school_id,
        trash: false,
      },
    });
    if (!driver) {
      return res.status(404).json({
        error: "Driver not found",
      });
    }
    await driver.update({ trash: true });
    res.status(200).json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.log("Error in deleting driver: ", error);
  }
};

//admin sees driver assinged routes
const getDriverAssignedRoutesAdmin = async (req, res) => {
  try {
    const { driverId } = req.params;
    const school_id = req.user.school_id;
    const driver = await Driver.findOne({
      where: {
        id: driverId,
        trash: false,
        school_id: school_id
      },
      attributes: ["id", "name", "phone"],
      include: [
        {
          model: StudentRoutes,
          as: "routes",
          attributes: ["id", "route_name", "vehicle_id", "type", "active", "activated_at"],
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
    const school_id = req.user.school_id;
    const driver = await Driver.findOne({
      where: {
        user_id,
        trash: false,
        school_id: school_id,
      },
      attributes: ["name", "phone"],
      include: [
        {
          model: StudentRoutes,
          as: "routes",
          attributes: [
            "id",
            "route_name",
            "vehicle_id",
            "type",
            "active",
            "activated_at",
            "isLock",
            "pickId"
          ],
          through: { attributes: [] },
          include: [
            {
              model: Student,
              as: "students",
              attributes: [],
              where: { trash: false },
              required: false,
            },
            {
              model: Stop,
              as: "stops",
              attributes: [],
              where: { trash: false },
              required: false,
            },
          ],
        },
      ],
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
      });
    }

    for (const route of driver.routes) {

      const totalStudents = await StudentRouteAssignment.count({
        where: {
          route_id: route.id,
          trash: false,
        },
      });

      const totalStops = await Stop.count({
        where: {
          route_id: route.id,
          trash: false,
        },
      });

      route.dataValues.total_students = totalStudents;
      route.dataValues.total_stops = totalStops;
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

    if (!route) {
      return res.status(404).json({
        message: "Route not found",
      });
    }

    const existingStop = await Stop.findOne({
      where: {
        route_id,
        stop_name,
        priority,
        trash: false,
      },
    });
    if (existingStop) {
      return res.status(400).json({
        message: "Stop name and priority already exists for this route",
      });
    }

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

//to get stops details with students for a driver
const getStopsForDriver = async (req, res) => {
  try {
    const { route_id } = req.params;
    const user_id = req.user.user_id;
    const driver = await Driver.findOne({
      where: {
        user_id,
        trash: false,
      },
    });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    const stops = await Stop.findAll({
      where: { route_id, trash: false, },
      attributes: ["id", "stop_name", "priority", "longitude", "latitude",],
      include: [
        {
          model: StudentRoutes,
          as: "route",
          attributes: ["route_name", "type", "isLock"],

        },
        {
          model: Student,
          as: "students",
          attributes: ["id", "full_name", "reg_no"],
          include: [
            {
              model: Guardian,
              as: "guardian",
              attributes: ["guardian_name", "guardian_contact"]
            }
          ]
        }
      ],

    });

    const result = stops.map((s) => {
      return {
        id: s.id,
        stop_name: s.stop_name,
        priority: s.priority,
        longitude: s.longitude,
        latitude: s.latitude,
        route_name: s.route.route_name,
        route_type: s.route.type,
        isLock: s.route.isLock,
        students: s.students.map((student) => ({
          id: student.id,
          full_name: student.full_name,
          reg_no: student.reg_no,
          guardian_name: student.guardian?.guardian_name || null,
          guardian_contact: student.guardian?.guardian_contact || null,
        })),
      }
    })

    return res.status(200).json({
      message: "Stops fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching stops:", error);
    return res.status(500).json({
      error: "Failed to fetch stops",
    });
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

//driver deletes the students from the stop
const deleteStudentsFromStop = async (req, res) => {
  try {
    const stop_id = req.params.stop_id;
    const { student_id } = req.body;
    const user_id = req.user.user_id;

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
          attributes: ["id", "isLock"],
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

    if (stop.route?.isLock === true) {
      return res.status(403).json({
        message: "This route is locked. You cannot modify students.",
      });
    }

    // ✅ USE findOne INSTEAD OF findAll
    const student = await Student.findOne({
      where: {
        id: student_id,
        stop_id: stop_id,
        trash: false,
      },
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found in this stop",
      });
    }

    // ✅ Now this works because it's a model instance
    await student.update({
      trash: true,
    });

    return res.status(200).json({
      message: "Student marked as deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting students from stop:", error);
    return res.status(500).json({
      error: "Failed to delete students from stop",
    });
  }
};

//driver sees students under a routes assigned to them
const getMyStudents = async (req, res) => {
  try {
    const { route_id } = req.params;
    const user_id = req.user.user_id;

    if (!route_id) {
      return res.status(404).json({
        error: "Route id is required",
      });
    }

    // Verify if the route exists and is assigned to the driver
    const route = await StudentRoutes.findOne({
      where: { id: route_id, trash: false },
      include: [
        {
          model: Driver,
          as: "drivers",
          where: { user_id, trash: false },
          attributes: [],
          through: { attributes: [] },
        },
        {
          model: Student,
          as: "students",
          where: { trash: false },
          required: false,
          through: { attributes: [] },
          include: [
            {
              model: Guardian,
              as: "guardian",
              attributes: ["guardian_name", "guardian_contact"]
            }
          ]
        }
      ],
    });

    if (!route) {
      return res.status(404).json({
        message: "Route not found or not assigned to you",
      });
    }
    if (!route.students || route.students.length === 0) {
      return res.status(404).json({
        message: "Students not found in this route",
      });
    }


    const students = route.students.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      reg_no: s.reg_no,
      guardian_name: s.guardian?.guardian_name || null,
      guardian_contact: s.guardian?.guardian_contact || null,
    }));

    if (!students || students.length === 0) {
      return res.status(404).json({
        message: "Students not found in this route",
      });
    }

    return res.status(200).json({
      message: "Students fetched successfully",
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({
      error: "Failed to fetch students",
    });
  }
};

//get each stop details for driver 
const getStopDetailsForDriver = async (req, res) => {
  try {
    const { stop_id } = req.params;
    const user_id = req.user.user_id;
    if (!stop_id) {
      return res.status(400).json({
        message: "stop id required"
      });
    }


    const driver = await Driver.findOne({
      where: {
        user_id,
        trash: false,
      },
    });

    if (!driver) {
      return res.status(403).json({
        message: "Driver profile not found",
      });
    }
    const singlestop = await Stop.findOne({
      where: {
        id: stop_id,
        trash: false,

      },
      attributes: ["id", "priority", "stop_name", "longitude", "latitude",],
      include: [
        {
          model: Student,
          as: "students",
          attributes: ["id", "full_name", "reg_no"],
          include: [
            {
              model: Guardian,
              as: "guardian",
              attributes: ["guardian_name"],
              required: false,
            }
          ]

        },
        {
          model: StudentRoutes,
          as: "route",
          attributes: ["id"],
        }
      ]

    });
    if (!singlestop) {
      return res.status(404).json({
        message: "stop not found"
      });
    }

    const result = {
      id: singlestop.id,
      priority: singlestop.priority,
      stop_name: singlestop.stop_name,
      longitude: singlestop.longitude,
      latitude: singlestop.latitude,
      route_id: singlestop.route?.id || null,
      students: singlestop.students.map((student) => ({
        id: student.id,
        full_name: student.full_name,
        reg_no: student.reg_no,
        guardian_name: student.guardian?.guardian_name || null,
      })),
    };


    return res.status(200).json({
      message: "Stop details fetched successfully",
      data: result,
    });

  } catch (error) {
    console.log("Error in fetching stop details: ", error);
    return res.status(500).json({
      error: "Failed to fetch stop details"
    });
  }
}

//update route active 
const updateRouteActive = async (req, res) => {
  try {
    const { route_id } = req.body;
    const user_id = req.user.user_id;

    if (!route_id) {
      return res.status(400).json({
        message: "Route id is required",
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

    const existingActiveRoute = await StudentRoutes.findOne({
      where: {
        active: true,
        activated_by_driver_id: driver.id,
        trash: false,
      },
    });

    if (existingActiveRoute) {
      return res.status(400).json({
        message: "You already have an active route. Deactivate it first.",
      });
    }

    const route = await StudentRoutes.findOne({
      where: { id: route_id, trash: false },
      include: [
        {
          model: Driver,
          as: "drivers",
          where: { id: driver.id },
          through: { attributes: [] },
        },
      ],
    });

    if (!route) {
      return res.status(403).json({
        message: "Route not assigned to you",
      });
    }
    route.active = true;
    route.activated_by_driver_id = driver.id;
    route.activated_at = new Date();
    await route.save();
    return res.status(200).json({
      message: "Route activated successfully",
    });

  } catch (error) {
    console.log("Failed to activate the route:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};


//Update current stop and Mark which students got down at that stop
const updateStopandStudent = async (req, res) => {
  try {
    const { stop_id, student_ids } = req.body;
    const user_id = req.user.user_id;

    if (!stop_id || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        message: "Stop id and student_ids array are required",
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
    const activeRoute = await StudentRoutes.findOne({
      where: {
        activated_by_driver_id: driver.id,
        active: true,
        trash: false,
      },
    });

    if (!activeRoute) {
      return res.status(400).json({
        message: "No active route found",
      });
    }

    const stop = await Stop.findOne({
      where: {
        id: stop_id,
        route_id: activeRoute.id,
        trash: false,
      },
    });

    if (!stop) {
      return res.status(404).json({
        message: "Stop not found in this route",
      });
    }

    stop.arrived = true;
    stop.arrived_time = new Date();
    await stop.save();
    let finalStatus;

    if (activeRoute.type === "DROP") {
      finalStatus = "DROPPED";
    } else if (activeRoute.type === "PICKUP") {
      finalStatus = "PICKED";
    } else {
      return res.status(400).json({
        message: `Invalid route type: ${activeRoute.type}`,
      });
    }

    await Student.update(
      { student_status: finalStatus },
      {
        where: {
          id: student_ids,
        },
      }
    );
    const students = await Student.findAll({
      where: { id: student_ids },
      attributes: ["id", "full_name", "reg_no", "student_status"],
    });

    const result = students.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      reg_no: r.reg_no,
      student_status: r.student_status,
      arrived_time: stop.arrived_time || null,
    }));

    return res.status(200).json({
      message: `${finalStatus} updated successfully`,
      route_type: activeRoute.type,
      data: result,
    });

  } catch (error) {
    console.log("Failed to update stop and student:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

//driver sets route as inactive 
const routeInactive = async (req, res) => {
  try {
    const { route_id } = req.body;
    const user_id = req.user.user_id;
    const driver = await Driver.findOne({
      where: { user_id, trash: false },
    });

    if (!driver) {
      return res.status(403).json({
        message: "Driver profile not found",
      });
    }

    const inactiveroute = await StudentRoutes.findOne({
      where: {
        id: route_id,
        activated_by_driver_id: driver.id,
        active: true,
        trash: false,
      },
    });

    if (!inactiveroute) {
      return res.status(404).json({
        message: "No active routes found",
      });
    }

    inactiveroute.active = false;
    await inactiveroute.save();

    return res.status(200).json({
      message: "Route has been inactivated",
      route_id: inactiveroute.id,
    });

  } catch (error) {
    console.log("Failed to inactivate the route: ", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

//assign bulk of stops to the route if route isLOck is false
const bulkStopCreation = async (req, res) => {
  try {
    const { route_id, stops } = req.body;
    const user_id = req.user.user_id;

    if (!route_id || !stops || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ message: "Fields are missing or stops must be a non-empty array" });
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

    if (!route) {
      return res.status(404).json({
        message: "Route not found",
      });
    }

    const existingStops = await Stop.findAll({
      where: {
        route_id,
        trash: false,
        [Op.or]: stops.map(s => ({ stop_name: s.stop_name, priority: s.priority })),
      },
    });
    if (existingStops.length > 0) {
      const conflictDetails = existingStops.map(s => `"${s.stop_name}" (priority: ${s.priority})`).join(", ");
      return res.status(400).json({
        message: `The following stops already exist for this route: ${conflictDetails}`,
      });
    }

    // Create stop
    const stopsToCreate = stops.map(stop => ({
      route_id,
      stop_name: stop.stop_name,
      priority: stop.priority,
      latitude: stop.latitude,
      longitude: stop.longitude,
      trash: false,
    }));

    const createdStops = await Stop.bulkCreate(stopsToCreate, { returning: true });

    res.status(201).json({
      message: `${createdStops.length} stops created successfully`,
      stops: createdStops,
    });
  } catch (error) {
    console.error("Error creating stop:", error);
    res.status(500).json({ error: "Failed to create stop" });
  }
};



module.exports = {
  getDriverById,
  updateDriverById,
  deleteDriverById,
  getDriverAssignedRoutesAdmin,
  DriverAssignedRoutes,
  createStopForDriver,
  assignStudentsToStop,
  getMyStudents,
  getStopsForDriver,
  getStopDetailsForDriver,
  updateRouteActive,
  updateStopandStudent,
  routeInactive,
  deleteStudentsFromStop,
  bulkStopCreation,
};
