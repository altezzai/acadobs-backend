const { where } = require("sequelize");
const Driver = require("../models/tracker/driver");
const Routes  = require("../models/tracker/routes");
const Stop = require("../models/tracker/stop");
const Student  = require("../models/student");
const LiveLocation = require("../models/tracker/livelocation");
const User = require("../models/user");
const StudentsStopStatus = require("../models/tracker/students_stop_status");
const Class = require("../models/class");
const { Sequelize } = require("sequelize");
const { Op } = require("sequelize");
const { deleteFile } = require("../middlewares/storageUploads");
const logger = require("../utils/logger");
// getDriverById
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const driver = await User.findOne({
      where: {
        id,
        trash: false,
        school_id: school_id,
        role: "driver",
      },
      attributes: ["id", "name", "phone", "email","dp"],
      include: [
        {
          model: Routes,
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error fetching driver:", error);
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

 
    const user = await User.findOne({
      where: {
        id,
        trash: false,
        school_id: school_id,
        role: "driver",
      },
    });
    if (!user) {
      return res.status(404).json({
        error: "Driver not found",
      });
    }

    const newPhotoUrl = req.uploadedFiles?.photo?.[0]?.url || null;

    let finalPhoto = user.dp;

    if (newPhotoUrl) {
      if (user.dp) {
        await deleteFile(user.dp);
      }
      finalPhoto = newPhotoUrl;
    }

    await user.update({
      name,
      dp: finalPhoto,
    });
    const driver = await Driver.findOne({
      where: {
        user_id: id,
        school_id: school_id,
        trash: false,
      },
    });

    await driver.update({ phone, email, address });

    return res.status(200).json({
      message: "Driver updated successfully",
      data: user,
    });
  } catch (error) {
     logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error updating driver:", error);
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
    const driver = await User.findOne({
      where: {
        id: id,
        school_id: school_id,
        trash: false,
        role: "driver",
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
     logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error in deleting driver:", error);
    console.log("Error in deleting driver: ", error);
  }
};

//admin sees driver assinged routes
const getDriverAssignedRoutesAdmin = async (req, res) => {
  try {
    const { driverId } = req.params;
    const school_id = req.user.school_id;
    const driver = await User.findOne({
      where: {
        id: driverId,
        trash: false,
        school_id: school_id,
        role: "driver",
      },
      attributes: ["id", "name", "phone","user_id",],
      include: [
        {
          model: Routes,
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
     logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error fetching driver routes:", error);
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
    const driver = await User.findOne({
      where: {
        id:user_id,
        trash: false,
        school_id: school_id,
      },
      attributes: ["name", "phone"],
      include: [
        {
          model: Routes,
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
          include: [
            {
              model: Student,
              as: "students",
              where: { trash: false },
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

      const totalStudents = await Student.count({
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error fetching driver routes:", error);
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
    const school_id = req.user.school_id;

    if (!route_id || !stop_name) {
      return res.status(400).json({ message: "Fields are missing" });
    }
    const driver = await User.findOne({
      where: {
        id:user_id,
        trash: false,
        school_id,
        role: "driver",
      },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const route = await Routes.findOne({
      where: {
        id: route_id,
        trash: false,
        driver_id: user_id,
      },
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
        trash: false,
      },
    });
    if (existingStop) {
      return res.status(400).json({
        message: "Stop name  already exists for this route",
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error creating stop:", error);
    console.error("Error creating stop:", error);
    res.status(500).json({ error: "Failed to create stop" });
  }
};

const getStopsForDriverByRouteId = async (req, res) => {
  try {
    const { route_id } = req.params;
    const user_id = req.user.user_id;
    const school_id = req.user.school_id;

    const driver = await User.findOne({
      where: {
        id:user_id,
        trash: false,
        role: "driver",
        school_id,
      },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const route = await Routes.findOne({
      where: {
        id: route_id,
        trash: false,
        driver_id: user_id,
      },
     
    });

    if (!route) {
      return res.status(403).json({
        message: "You are not assigned to this route",
      });
    }
    const stops = await Stop.findAll({
      where: { route_id, trash: false },
      order: [["priority", "ASC"]],
      attributes: ["id", "stop_name", "priority", "longitude", "latitude"],
      include: [
        {
          model: Student,
          as: "students",
          attributes: [
            "id",
            "full_name",
            "reg_no",
          ],
          include: [
            {
              model: User,
              attributes: ["name", "phone"],
            },
          ],
        },
      ],
    });
    return res.status(200).json({
      message: "Stops fetched successfully",
      route,
      data: stops,
    });

  } catch (error) {
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error fetching stops:", error);
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
    const school_id = req.user.school_id;

    if (!Array.isArray(student_ids) || student_ids.length === 0 || !stop_id) {
      return res.status(400).json({
        message: "student_ids (array) and stop_id are required",
      });
    }


    const driver = await User.findOne({
      where: { id:user_id, trash: false, role: "driver" , school_id},
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
          model: Routes,
          as: "route",
          attributes: ["driver_id"],
          where: { driver_id: user_id },
          
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error assigning students to stop:", error);
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
    const school_id = req.user.school_id;

    const driver = await User.findOne({
      where: { id:user_id, trash: false , role: "driver" , school_id},
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
          model: Routes,
          as: "route",
          attributes: ["id", "isLock"],
          where: { driver_id: user_id },
         
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error deleting students from stop:", error);
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
    const school_id = req.user.school_id;

    if (!route_id) {
      return res.status(404).json({
        error: "Route id is required",
      });
    }

    // Verify if the route exists and is assigned to the driver
    const route = await Routes.findOne({
      where: { id: route_id, trash: false },
      include: [
        {
          model: User,
           as: "driver",
          where: { id:user_id, trash: false, role: "driver" , school_id},
          attributes: ["id", "name", "phone","dp"],
        },
        {
          model: Student,
          as: "students",
          where: { trash: false,school_id },
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error fetching students:", error);
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
    const school_id = req.user.school_id;
    if (!stop_id) {
      return res.status(400).json({
        message: "stop id required"
      });
    }


    const driver = await User.findOne({
      where: {
        id:user_id,
        trash: false,
        role: "driver",
        school_id,
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
              model: User,
              attributes: ["name"],
              required: false,
            }
          ]

        },
        {
          model: Routes,
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
        guardian_name: student.User?.name || null,
      })),
    };


    return res.status(200).json({
      message: "Stop details fetched successfully",
      data: result,
    });

  } catch (error) {
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error in fetching stop details:", error);
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
    const school_id = req.user.school_id;

    if (!route_id) {
      return res.status(400).json({
        message: "Route id is required",
      });
    }

    const driver = await User.findOne({
      where: {id: user_id, trash: false, role: "driver", school_id },
    });

    if (!driver) {
      return res.status(403).json({
        message: "Driver profile not found",
      });
    }

    const existingActiveRoute = await Routes.findOne({
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

    const route = await Routes.findOne({
      where: { id: route_id, trash: false }, 
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error in activating the route:", error);
    console.log("Failed to activate the route:", error);
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
    const school_id = req.user.school_id;
    const driver = await User.findOne({
      where: { id:user_id, trash: false, role: "driver", school_id },
    });

    if (!driver) {
      return res.status(403).json({
        message: "Driver profile not found",
      });
    }

    const inactiveroute = await Routes.findOne({
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error in inactivating the route:", error);
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
    const school_id = req.user.school_id;

    if (!route_id || !stops || !Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ message: "Fields are missing or stops must be a non-empty array" });
    }


    const driver = await User.findOne({
      where: {
        id:user_id,
        trash: false,
        role: "driver",
        school_id
      },
    });


    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const route = await Routes.findOne({
      where: {
        id: route_id,
        trash: false,
        driver_id: user_id,
      },
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error in creating stop:", error);
    console.error("Error creating stop:", error);
    res.status(500).json({ error: "Failed to create stop" });
  }
};
const updateStopandStudent = async (req, res) => {try {
  
  const user_id = req.user.user_id;
  const school_id = req.user.school_id;
  const {
    stop_id,
    latitude,
    longitude,
    student_ids,
  } = req.body;

  if (
    !stop_id || !latitude || !longitude ||
    !Array.isArray(student_ids) ||
    student_ids.length === 0
  ) {
    return res.status(400).json({
      message: "stop_id, latitude, longitude and student_ids array are required",
    });
  }

  const driver = await User.findOne({
    where: {
      id: user_id,
      trash: false,
      role: "driver",
      school_id,
    },
  });

  if (!driver) {
    return res.status(403).json({
      message: "Driver profile not found",
    });
  }

  const stop = await Stop.findOne({
    where: {
      id: stop_id,
      trash: false,
    },
  });

  if (!stop) {
    return res.status(404).json({
      message: "Stop not found",
    });
  }

  const activeRoute = await Routes.findOne({
    where: {
      id: stop.route_id,
      activated_by_driver_id: user_id,
      active: true,
      trash: false,
    },
  });

  if (!activeRoute) {
    return res.status(400).json({
      message: "No active route found",
    });
  }

  let successStatus;
  let failedStatus;

  if (activeRoute.type === "DROP") {
    successStatus = "dropped";
    failedStatus = "not_dropped";
  } else if (activeRoute.type === "PICKUP") {
    successStatus = "picked";
    failedStatus = "not_picked";
  } else {
    return res.status(400).json({
      message: `Invalid route type: ${activeRoute.type}`,
    });
  }

  const stopStudents = await Student.findAll({
    where: {
      stop_id: stop_id,
      trash: false,
      alumni: false,
    },
    attributes: ["id"],
  });

  if (!stopStudents.length) {
    return res.status(404).json({
      message: "No students found for this stop",
    });
  }
  const selectedStudentIds = new Set(
    student_ids.map((id) => String(id))
  );
  const liveLocation = await LiveLocation.create({
    user_id,
    latitude,
    longitude,
    route_id: activeRoute.id,
    stop_id,
  });

  const studentStatuses = stopStudents.map((student) => {
    const isSelected = selectedStudentIds.has(
      String(student.id)
    );

    return {
      livelocation_id: liveLocation.id,
      student_id: student.id,
      status: isSelected
        ? successStatus
        : failedStatus,
    };
  });

  await StudentsStopStatus.bulkCreate(studentStatuses);

  return res.status(200).json({
    message: `${stop.stop_name} updated successfully`,
    route_type: activeRoute.type,
    data: {
      liveLocation,
      students: studentStatuses,
    },
  });

} catch (error) {
  logger.error(
    "role:",
    req.user.role,
    "userId:",
    req.user.user_id,
    "Error in updating stop and student:",
    error
  );

  console.log(
    "Failed to update stop and student:",
    error
  );

  return res.status(500).json({
    error: "Internal server error",
  });
}
};

const updateLiveLocation = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const school_id = req.user.school_id;
    const { latitude, longitude,route_id,stop_id } = req.body;

    if (!latitude || !longitude || !route_id){
      return res.status(400).json({ message: "Fields are missing" });
    }
    const user = await User.findOne({
      where: {
        id:user_id,
        trash: false,
        role: "driver",
        school_id,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Driver not found" });
    }
    const route = await Routes.findOne({
      where: {
        id: route_id,
        trash: false,
        driver_id: user_id,
        active: true,
      },
    });
    if (!route) {
      return res.status(404).json({
        message: "Route not found",
      });
    }
    const latestLocation = await LiveLocation.findOne({
      where: {
        route_id,
      },
      order: [["createdAt", "DESC"]],
    });
    if (latestLocation) {
      const now = Date.now();
      const createdAt = new Date(latestLocation.createdAt).getTime();

      const differenceInSeconds = (now - createdAt) / 1000;

      if (differenceInSeconds < 20) {
        const remainingSeconds = Math.ceil(20 - differenceInSeconds);

        return res.status(429).json({
          success: false,
          message: `Live location can be updated only once every 20 seconds`,
          remainingSeconds,
        });
      }
    }
    await LiveLocation.create(
      {
        user_id,
        latitude,
        longitude,
        route_id,
      },
    );
    return res.status(200).json({
      message: "Live location updated successfully",
      success: true,
      latitude,
      longitude,
      route_id,
     });
  } catch (error) {
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error in updating live location:", error);
    console.error("Error updating live location:", error);
    res.status(500).json({ error: "Failed to update live location" });
  }
}
const getlatestLocationByRouteId = async (req, res) => {
  try {
    const { route_id } = req.params;
    const liveLocation = await LiveLocation.findOne({
      where: {
        route_id,
      },
      attributes: ["latitude", "longitude", "route_id", "stop_id"],
      order: [["createdAt", "DESC"]],
      limit: 1,
      include: [
        {
          model: Stop,
          attributes: ["id", "stop_name","priority","latitude","longitude"],
        },
        {
          model: Routes,
          where: { },
          attributes: ["id", "route_name","active"],
        },
      ]
    });
    if (!liveLocation) {
      return res.status(404).json({ message: "Live location not found" });
    }
    return res.status(200).json({
      message: "Live location fetched successfully",
      data: liveLocation,
    });
  } catch (error) {
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error in getting live location:", error);
    console.error("Error getting live location:", error);
    res.status(500).json({ error: "Failed to get live location" });
  }
}
const getTrackedDataWithDateByRouteId = async (req, res) => {
  try {
    const { route_id } = req.params;
    const school_id = req.user.school_id;
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const route = await Routes.findOne({
      where: {
        id: route_id,
        school_id: school_id,
        trash: false,
      },
      attributes: ["id", "route_name","type","active"],
    })
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }
 
    const trackedData = await LiveLocation.findAll({
      where: {
        route_id,
        stop_id:{[Op.ne]: null},
        createdAt: {
          [Op.gte]: date + " 00:00:00",
          [Op.lte]: date + " 23:59:59",
        }
      },
      attributes: ["latitude", "longitude", "route_id", "stop_id"],
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Stop,
          attributes: ["id", "stop_name","priority","latitude","longitude"],
        }, 
        {
          model: StudentsStopStatus,
          attributes: ["id", "student_id", "status"],
          include: [
            {
              model: Student,
              attributes: ["full_name", "id",],
              include: [
                {
                  model: Class,
                  attributes: ["id", "classname"],
                },
              ],
            },
          ]
        },
      ]}
    );
  
    return res.status(200).json({
      message: "Route fetched successfully",
      route,
      data: trackedData,
    });
  } catch (error) {
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error in getting route details:", error);
    console.error("Error getting route details:", error);
    res.status(500).json({ error: "Failed to get route details" });
  }
}
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({
        message: "school not found"
      });
    }
    const studentroute = await Routes.findOne({
      where: { id: id, school_id: school_id, trash: false },
      attributes: ["id", "route_name", "vehicle_id", "type","driver_id","active"],
      include: [
        {
          model: User,
          attributes: ["name"],
          as:"driver",
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
          include: [
            {
              model: User,
              attributes: ["name", "phone"],
            },
          ],
        },
        {
          model: Stop,
          as: "stops",
          attributes: ["id", "stop_name", "priority"]
        }
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

      driver: studentroute.driver.name,
      stops: studentroute.stops?.map(stop => ({
        id: stop.id,
        stop_name: stop.stop_name,
        priority: stop.priority
      })) || [],
      students: studentroute.students?.map(student => ({
        id: student.id,
        class_id: student.class_id,
        reg_no: student.reg_no,
        full_name: student.full_name,
        address: student.address,
        guardian: student.User
          ? {
            id: student.User.id,
            guardian_name: student.User.name,
            guardian_contact: student.User.phone,
          }
          : null
      })) ?? []
    };
    return res
      .status(200)
      .json({ message: "Route fetched successfully", data: result });
  } catch (error) {
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error fetching route:", error);
    console.log("Error has occured: ", error);
    return res.status(500).json({ error: "Failed to fetch route" });
  }
};

//update route
const updateRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const { start, stop, route_no, vehicle_id, driver_id, isLock, hasDropRoute } = req.body;
    const pickupRoute = await Routes.findOne({
      where: {
        id: id,
        school_id: school_id, trash: false,
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
      // type: pickupRoute.type,
      isLock: isLock ?? pickupRoute.isLock,
    });
    if (driver_id) {
      await pickupRoute.setDrivers(Array.isArray(driver_id) ? driver_id : [driver_id]);
    }

    const dropRoute = await Routes.findOne({
      where: { pickId: pickupRoute.id, school_id: school_id, trash: false }
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
      const newDropRoute = await Routes.create({
        school_id: school_id,
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error updating route:", error);
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
    const school_id = req.user.school_id;
    const studentroute = await Routes.findOne({
      where: {
        id: id,
        school_id: school_id,
        trash: false,
      },
    });
    if (!studentroute) {
      return res.status(404).json({ message: "No route found" });
    }
    await studentroute.destroy();

    res.status(200).json({ message: "Route deleted successfully" });
  } catch (error) {
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error deleting route:", error);
    console.error("Error deleting route:", error);
    return res.status(500).json({
      error: "Failed to delete route",
    });
  }
};
const getStopById = async (req, res) => {
  try {
    const { id } = req.params;

    const studentStop = await Stop.findOne({
      where: {
        id,
        trash: false,
      },
      attributes: ["route_id", "stop_name", "longitude", "latitude"],
    });

    if (!studentStop) {
      return res.status(404).json({
        message: "Stop not found",
      });
    }

    return res.status(200).json({
      message: "Stop fetched successfully",
      data: studentStop,
    });
  } catch (error) {
     logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error fetching stop:", error);
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
    const studentStop = await Stop.findOne({
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error updating stop:", error);
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
    const school_id = req.user.school_id;

    const { stop_name, longitude, latitude, priority } = req.body;
    const driverData = await User.findOne({
      where: {
        id: driverId,
        trash: false,
        role: "driver",
        school_id,
      },
    });

    if (!driverData) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    const stopData = await Stop.findOne({
      where: {
        id: stopId,
        trash: false,
      },
      include: [
        {
          model: Routes,
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error updating stop for driver:", error);
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
    const studentStop = await Stop.findOne({
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
    logger.error("role:", req.user.role,"userId:", req.user.user_id, "Error deleting stop:", error);
    console.log("error in deleting stop", error);
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
  getStopsForDriverByRouteId,
  getStopDetailsForDriver,
  updateRouteActive,
  updateStopandStudent,
  routeInactive,
  deleteStudentsFromStop,
  bulkStopCreation,
  
  updateLiveLocation,
  getlatestLocationByRouteId ,
  getTrackedDataWithDateByRouteId,
  getRouteById,
  updateRouteById,
  deleteRoute,

  getStopById, 
  updateStopById, 
  deleteStop, 
  updateStopForDriver ,

};
