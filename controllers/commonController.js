const { Op, where, DATEONLY } = require("sequelize");
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

const { Class } = require("../models");

const getStudentsByClassId = async (req, res) => {
  try {
    const { class_id } = req.params;
    const school_id = req.user.school_id || "";
    const searchQuery = req.query.q || "";

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
    const classData = await Class.findAll({
      where: {
        year: year,
      },
      attributes: ["id", "division", "classname"],
    });

    if (!classData) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(classData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id || "";
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
        { model: User, attributes: ["name", "email", "phone", "dp"] },
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
    res.status(500).json({ error: "Failed to get student" });
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
    res.status(500).json({ error: err.message });
  }
};
const getStudentAttendanceByDate = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const date = req.query.date || new Date();
    // const attendance = await AttendanceMarked.findAll({
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
      totalcontent: count,
      totalPages,
      currentPage: page,
      attendance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const allAchievementBySchoolId = async (req, res) => {
  try {
    const { school_id } = req.params;
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
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getStudentsByClassId,
  getschoolIdByStudentId,
  getStudentById,

  getClassesByYear,

  getHomeworkByStudentId,

  getAttendanceByStudentId,
  getStudentAttendanceByDate,

  allAchievementBySchoolId,
  achievementByStudentId,

  getInternalMarkByStudentId,
};
