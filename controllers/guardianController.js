const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { compressAndSaveFile } = require("../utils/fileHandler");
const HomeworkAssignment = require("../models/homeworkassignment");
const Student = require("../models/student");
const Homework = require("../models/homework");
const Attendance = require("../models/attendance");
const AttendanceMarked = require("../models/attendancemarked");
const InternalExam = require("../models/internal_exams");
const Mark = require("../models/marks");
const Subject = require("../models/subject");
const School = require("../models/school");
const User = require("../models/user");
const Guardian = require("../models/guardian");
const Achievement = require("../models/achievement");
const StudentAchievement = require("../models/studentachievement");
const Payment = require("../models/payment");
const { Class } = require("../models");

const updateHomeworkAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const { status, points, student_id } = req.body;

    const assignment = await HomeworkAssignment.findOne({
      where: { id, student_id: student_id },
    });
    console.log(assignment);
    if (!assignment) return res.status(404).json({ error: "Not found" });
    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/solved_homeworks/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    await assignment.update({
      status,
      points,
      solved_file: fileName ? fileName : assignment.solved_file,
    });
    res.status(200).json({ message: "Updated successfully", assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
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
          attributes: ["id", "description", "due_date", "file"],
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
const getSchoolIdByStudentId = async (student_id) => {
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
const getPaymentByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      student_id: student_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { payment_type: { [Op.like]: `%${searchQuery}%` } },
        { amount: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (date) {
      whereClause.payment_date = date;
    }
    const { count, rows: payment } = await Payment.findAndCountAll({
      offset,
      distinct: true, // Add this line
      limit,
      where: whereClause,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      payment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = {
  updateHomeworkAssignment,
  getHomeworkByStudentId,
  getAttendanceByStudentId,
  getStudentAttendanceByDate,

  getSchoolIdByStudentId,

  allAchievementBySchoolId,
  achievementByStudentId,

  getPaymentByStudentId,
};
