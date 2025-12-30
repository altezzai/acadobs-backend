const { Op, where, DATEONLY } = require("sequelize");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");

const User = require("../models/user");
const Student = require("../models/student");
const HomeworkAssignment = require("../models/homeworkassignment");
const Homework = require("../models/homework");
const AttendanceMarked = require("../models/attendancemarked");
const Attendance = require("../models/attendance");
const Achievement = require("../models/achievement");
const StudentAchievement = require("../models/studentachievement");
const InternalMark = require("../models/internal_marks");
const Subject = require("../models/subject");
const Marks = require("../models/marks");
const LeaveRequest = require("../models/leaverequest");
const School = require("../models/school");
const Event = require("../models/event");
const News = require("../models/news");
const Payment = require("../models/payment");
const AccountDelete = require("../models/accountdelete");
const Syllabus = require("../models/syllabus");
const NewsImage = require("../models/newsimage");

const { Class } = require("../models");

const {
  compressAndSaveFile,
  deletefilewithfoldername,
} = require("../utils/fileHandler");

const getStudentsByClassId = async (req, res) => {
  try {
    const { class_id } = req.params;
    const school_id = req.user.school_id || "";
    const searchQuery = req.query.q || "";
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }
    const { count, rows: students } = await Student.findAndCountAll({
      where: {
        class_id,
        school_id,
        full_name: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },
      attributes: ["id", "full_name", "roll_number", "class_id", "image"],
      include: [
        { model: Class, attributes: ["id", "year", "division", "classname"] },
      ],
      order: [["roll_number", "ASC"]],
    });

    res.status(200).json({
      totalcontent: count,
      students,
    });
  } catch (err) {
    console.error("Error fetching students by class ID:", err);
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching students by class ID:",
      err
    );
    res.status(500).json({ error: "Failed to fetch students by class ID" });
  }
};
const getschoolIdByStudentId = async (student_id) => {
  try {
    const student = await Student.findByPk(student_id);
    if (!student) console.log("student not found ---");
    const school_id = student.school_id;
    return school_id;
    // res.status(200).json({ school_id });
  } catch (err) {
    return "error in getting school id";
  }
};
const getClassesByYear = async (req, res) => {
  try {
    const year = req.params.year;
    const school_id = req.user.school_id;
    const classData = await Class.findAll({
      where: {
        year: year,
        school_id,
      },
      attributes: ["id", "division", "classname"],
    });

    if (!classData) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(classData);
  } catch (err) {
    res.status(500).json({ error: err.message });
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching classes by year:",
      err
    );
  }
};
const getStaffsForFilter = async (req, res) => {
  const school_id = req.user.school_id;
  try {
    const searchQuery = req.query.q || "";
    let whereClause = {
      role: "teacher",
      school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
        { phone: { [Op.like]: `%${searchQuery}%` } },
        ,
      ];
    }
    const staffs = await User.findAll({
      where: whereClause,
      attributes: ["id", "name", "phone"],
    });
    res.status(200).json(staffs);
  } catch (err) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching staffs for filter:",
      err
    );
    res.status(500).json({ error: err.message });
  }
};
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id || "";
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }

    const student = await Student.findOne({
      where: { id, school_id, trash: false },
      attributes: [
        "id",
        "full_name",
        "reg_no",
        "roll_number",
        "class_id",
        "image",
        "date_of_birth",
        "gender",
        "address",
        "admission_date",
        "status",
      ],
      include: [
        { model: User, attributes: ["id", "name", "email", "phone", "dp"] },
        {
          model: Class,
          attributes: ["id", "year", "division", "classname"],
        },
      ],
    });

    if (!student) return res.status(404).json({ error: "Student not found" });

    res.status(200).json(student);
  } catch (err) {
    console.error("Error getting student:", err);
    logger.error("userId:", req.user.user_id, "Error getting student:", err);
    res.status(500).json({ error: "Failed to get student" });
  }
};
const getGuarduianIdbyStudentId = async (student_id) => {
  try {
    const student = await Student.findByPk(student_id);
    if (!student) {
      return "student not found";
    }
    const guardian_id = student.guardian_id;
    return guardian_id;
  } catch (err) {
    console.error("Error in getting guardian id:", err);
    return "error in getting guardian id";
  }
};
// by student id
const getHomeworkByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;

    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: homework } = await HomeworkAssignment.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { student_id: student_id },
      include: [
        {
          model: Homework,
          where: {
            description: {
              [Op.like]: `%${searchQuery}%`,
            },

            trash: false,
          },
          attributes: ["id", "description", "due_date", "file", "title"],
          include: [
            {
              model: User,
              attributes: ["id", "name"],
            },
            {
              model: Subject,
              attributes: ["id", "subject_name"],
            },
          ],
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      homework,
    });
  } catch (err) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting homework by student id:",
      err
    );
    res.status(500).json({ error: err.message });
  }
};
const getAttendanceByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: attendance } = await AttendanceMarked.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { student_id: student_id },
      attributes: ["id", "status", "remarks"],
      include: [
        {
          model: Attendance,
          attributes: ["id", "date", "period"],

          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      attendance,
    });
  } catch (err) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting attendance by student id:",
      err
    );
    res.status(500).json({ error: err.message });
  }
};
const getStudentAttendanceByDate = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const id = await getschoolIdByStudentId(student_id);
    const date = req.query.date || new Date();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school = await School.findByPk(id, {
      attributes: ["period_count"],
    });
    const { count, rows: attendance } = await AttendanceMarked.findAndCountAll({
      offset,
      distinct: true,
      limit,

      where: { student_id: student_id },
      attributes: ["id", "status", "remarks"],
      include: [
        {
          model: Attendance,
          where: { date: date, trash: false },
          attributes: ["id", "date", "period"],

          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
    });
    if (!attendance) return res.status(404).json({ error: "Not found" });
    // res.status(200).json(attendance);
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      period_count: school["period_count"],
      totalcontent: count,
      totalPages,
      currentPage: page,
      attendance,
    });
  } catch (err) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting student attendance by date:",
      err
    );
    res.status(500).json({ error: err.message });
  }
};
const allAchievements = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }

    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      school_id: school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: achievements } = await Achievement.findAndCountAll({
      offset,
      distinct: true, // Add this line
      limit,
      where: whereClause, // Add this line
      include: [
        {
          model: StudentAchievement,
          attributes: ["student_id", "status", "proof_document", "remarks"],
          include: [
            {
              model: Student,
              attributes: ["id", "full_name", "reg_no", "image"],
              include: [
                {
                  model: Class,
                  attributes: ["id", "classname", "year", "division"],
                },
              ],
            },
          ],
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      achievements,
    });
  } catch (err) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting all achievements:",
      err
    );
    res.status(500).json({ error: err.message });
  }
};
const achievementByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: achievement } =
      await StudentAchievement.findAndCountAll({
        offset,
        distinct: true, // Add this line
        limit,
        where: { student_id: student_id },
        attributes: ["id", "status", "proof_document", "remarks"],
        include: [
          {
            model: Achievement,
            where: whereClause,
            attributes: [
              "id",
              "title",
              "description",
              "category",
              "level",
              "date",
            ],
          },
        ],
      });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      achievement,
    });
  } catch (err) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting achievement by student id:",
      err
    );
    res.status(500).json({ error: err.message });
  }
};
//get internalmark by student id
const getInternalMarkByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Assuming you have a model for InternalMark
    const { count, rows: Mark } = await Marks.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { student_id: student_id },

      include: [
        {
          model: InternalMark,
          where: {
            trash: false,
            school_id: school_id,
          },
          include: [
            {
              model: Subject,
              attributes: ["id", "subject_name"],
            },
          ],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      Mark,
    });
  } catch (err) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting internal mark by student id:",
      err
    );
    res.status(500).json({ error: err.message });
  }
};
const getLeaveRequestByStudentId = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      school_id: school_id,
      student_id: student_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { reason: { [Op.like]: `%${searchQuery}%` } },
        { leave_type: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (date) {
      whereClause[Op.or] = [
        { from_date: { [Op.like]: `%${date}%` } },
        { to_date: { [Op.like]: `%${date}%` } },
      ];
    }
    const { count, rows: leaves } = await LeaveRequest.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      attributes: [
        "id",
        "from_date",
        "to_date",
        "leave_type",
        "leave_duration",
        "reason",
        "attachment",
        "leave_duration",
        "status",
        "admin_remarks",
      ],
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      leaves,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching leave requests:",
      error
    );
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};
const getLatestEvents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;
    const { count, rows: events } = await Event.findAndCountAll({
      where: { school_id: school_id },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset,
      distinct: true,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      events,
    });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error fetching events:", error);
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};
const getLatestNews = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;
    const { count, rows: news } = await News.findAndCountAll({
      where: { school_id: school_id },
      include: [
        {
          model: NewsImage,
          attributes: ["id", "image"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset,
      distinct: true,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      news,
    });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error fetching news:", error);
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};
const getSchoolDetails = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const school = await School.findByPk(school_id, {
      attributes: [
        "id",
        "name",
        "address",
        "phone",
        "email",
        "logo",
        "period_count",
        "attendance_count",
        "syllabus_id",
        "primary_colour",
        "secondary_colour",
        "bg_image",
      ],
      include: [
        {
          model: Syllabus,
          attributes: ["name"],
        },
      ],
    });
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }
    res.status(200).json({ school });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching school details:",
      error
    );
    console.error("Error fetching school details:", error);
    res.status(500).json({ error: "Failed to fetch school details" });
  }
};
const changePassword = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    logger.error("userId:", req.user.user_id, "Error changing password:", err);
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
};
const updateFcmToken = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { fcm_token } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.fcm_token = fcm_token;
    await user.save();
    res.status(200).json({ message: "FCM token updated successfully" });
  } catch (err) {
    logger.error("userId:", req.user.user_id, "Error updating FCM token:", err);
    console.error("Error updating FCM token:", err);
    res.status(500).json({ error: "Failed to update FCM token" });
  }
};
const updateDp = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let fileName = user.dp;
    console.log("file in update dp", req.file);
    if (req.file) {
      const oldFileName = user.dp;
      const uploadPath = "uploads/dp/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
      await deletefilewithfoldername(oldFileName, uploadPath);
      console.log("New file saved:", fileName);
    }

    await user.update({ dp: fileName }, { where: { id: userId } });

    res.status(200).json({ message: "Profile picture updated successfully" });
  } catch (err) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error updating profile picture:",
      err
    );
    console.error("Error updating profile picture:", err);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }

    const payment = await Payment.findOne({
      where: { id: req.params.id, school_id, trash: false },
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image"],
        },
      ],
    });
    if (!payment || payment.trash)
      return res.status(404).json({ error: "Payment not found" });
    res.status(200).json(payment);
  } catch (err) {
    logger.error("userId:", req.user.user_id, "Error fetching payment:", err);
    console.error("Error fetching payment:", err);
    res.status(500).json({ error: err.message });
  }
};
const getAchievementsBySchool = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;
    const whereClause = {
      school_id,
      trash: false,
      level: {
        [Op.ne]: "class",
      },
    };
    const count = await Achievement.count({ where: whereClause });
    const achievements = await Achievement.findAll({
      where: whereClause,
      include: [
        {
          model: StudentAchievement,
          attributes: ["status", "remarks"],
          include: [
            {
              model: Student,
              attributes: ["id", "full_name", "reg_no", "image"],
              include: [
                {
                  model: Class,
                  attributes: ["id", "classname"],
                },
              ],
            },
          ],
        },
      ],
      limit,
      offset,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      achievements,
    });
  } catch (err) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching achievements:",
      err
    );
    console.error("Error fetching achievements:", err);
    res.status(500).json({ error: err.message });
  }
};
const accountDeleteRequests = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const reason = req.body.reason || "";

    const existingRequest = await AccountDelete.findOne({
      where: { user_id: userId },
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Delete request already exists" });
    }

    const deleteRequest = await AccountDelete.create({
      user_id: userId,
      reason,
    });

    res
      .status(200)
      .json({ message: "Delete request created successfully", deleteRequest });
  } catch (err) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error creating delete request:",
      err
    );
    console.error("Error creating delete request:", err);
    res.status(500).json({ error: "Failed to create delete request" });
  }
};
module.exports = {
  getStudentsByClassId,
  getschoolIdByStudentId,
  getStudentById,
  getGuarduianIdbyStudentId,

  getClassesByYear,
  getStaffsForFilter,

  getHomeworkByStudentId,

  getAttendanceByStudentId,
  getStudentAttendanceByDate,

  allAchievements,
  achievementByStudentId,

  getInternalMarkByStudentId,

  getLeaveRequestByStudentId,

  getLatestEvents,
  getLatestNews,
  getSchoolDetails,

  changePassword,
  updateFcmToken,
  updateDp,

  getPaymentById,

  getAchievementsBySchool,

  accountDeleteRequests,
};
