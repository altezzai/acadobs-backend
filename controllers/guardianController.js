const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { Op, where } = require("sequelize");
const {
  compressAndSaveFile,
  deletefilewithfoldername,
} = require("../utils/fileHandler");
const { Class } = require("../models");
const HomeworkAssignment = require("../models/homeworkassignment");
const Student = require("../models/student");
const School = require("../models/school");
const User = require("../models/user");
const Payment = require("../models/payment");
const LeaveRequest = require("../models/leaverequest");
const Notice = require("../models/notice");
const NoticeClass = require("../models/noticeclass");
const Staff = require("../models/staff");
const Staffsubject = require("../models/staffsubject");
const Subject = require("../models/subject");
const Timetable = require("../models/timetables");
const Invoice = require("../models/invoice");
const InvoiceStudent = require("../models/invoice_students");
const TimetableSubstitution = require("../models/timetable_substitutions");
const Chat = require("../models/chat");
const Message = require("../models/messages");
const Guardian = require("../models/guardian");
const Homework = require("../models/homework");
const Achievement = require("../models/achievement");
const StudentAchievement = require("../models/studentachievement");

const { getschoolIdByStudentId } = require("../controllers/commonController");

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

const getNoticeByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const student = await Student.findOne({
      where: { id: student_id, trash: false },
      attributes: ["class_id", "school_id"],
    });
    if (!student) return res.status(404).json({ error: "student not found" });
    const classId = student.class_id;
    const SchoolId = student.school_id;
    const whereClause = {
      trash: false,
      school_id: SchoolId,
      [Op.or]: [{ type: "all" }, { type: "classes" }],
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { content: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const notices = await Notice.findAll({
      where: whereClause,
      offset,
      limit,
      include: [
        {
          model: NoticeClass,
          attributes: ["class_id"],
          where: { class_id: classId },
          required: false,
          include: [
            {
              model: Class,
              attributes: ["classname"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
    const count = notices.length;
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      notices,
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
      include: [
        {
          model: InvoiceStudent,
          attributes: ["invoice_id"],
          required: false,
          include: [
            {
              model: Invoice,
              attributes: ["title", "category", "due_date", "amount"],
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
      payment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getInvoiceByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    if (!student_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const whereClause = { trash: false };

    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { amount: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { rows: invoices, count } = await InvoiceStudent.findAndCountAll({
      offset,
      limit,
      distinct: true,
      where: { student_id: student_id },
      include: [
        {
          model: Invoice,
          where: whereClause,
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      invoices,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};
const createLeaveRequest = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    const {
      student_id,
      from_date,
      to_date,
      leave_type,
      reason,
      leave_duration,
      half_section,
    } = req.body;
    if (!student_id || !from_date || !to_date || !leave_type || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existingRequest = await LeaveRequest.findOne({
      where: {
        school_id: school_id,
        user_id: user_id,
        student_id: student_id,
        from_date: from_date,
        to_date: to_date,
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already exists" });
    }

    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/leave_requests/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    const data = await LeaveRequest.create({
      school_id: school_id,
      user_id: user_id,
      student_id: student_id,
      role: "student",
      from_date: from_date,
      to_date: to_date,
      leave_type: leave_type,
      reason: reason,
      attachment: fileName ? fileName : null,
      leave_duration,
      half_section,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({ error: "Failed to create leave request" });
  }
};

const getAllLeaveRequests = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    if (!school_id || !user_id) {
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
      user_id: user_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [{ reason: { [Op.like]: `%${searchQuery}%` } }];
    }
    if (date) {
      whereClause[Op.or] = [
        { from_date: { [Op.like]: `%${date}%` } },
        { to_date: { [Op.like]: `%${date}%` } },
      ];
    }
    const { count, rows: leaves } = await LeaveRequest.findAndCountAll({
      offset,
      distinct: true, // Add this line
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
        "half_section",
      ],
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      leaves,
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};

const getLeaveRequestById = async (req, res) => {
  try {
    const Id = req.params.id;
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    if (!school_id || !user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const data = await LeaveRequest.findOne({
      where: {
        id: Id,
        user_id,
        school_id,
        trash: false,
      },
    });
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error) {
    console.error("Fetch One Error:", error);
    res.status(500).json({ error: "Failed to fetch leave request" });
  }
};

const updateLeaveRequest = async (req, res) => {
  try {
    const Id = req.params.id;
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    const {
      student_id,
      from_date,
      to_date,
      leave_type,
      reason,
      leave_duration,
      half_section,
    } = req.body;
    const data = await LeaveRequest.findByPk(Id);
    if (!data) return res.status(404).json({ error: "Not found" });
    const existingRequest = await LeaveRequest.findOne({
      where: {
        school_id: school_id,
        user_id: user_id,
        student_id: student_id,
        from_date: from_date,
        to_date: to_date,
        id: { [Op.ne]: Id },
      },
    });
    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already exists" });
    }
    let fileName = data.attachment;
    if (req.file) {
      const uploadPath = "uploads/leave_requests/";
      await deletefilewithfoldername(fileName, uploadPath);
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    await data.update({
      student_id: student_id,
      from_date: from_date,
      to_date: to_date,
      leave_type: leave_type,
      reason: reason,
      attachment: fileName ? fileName : null,
      leave_duration,
      half_section,
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Failed to update leave request" });
  }
};

const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRequest.findByPk(id);
    if (!leave) return res.status(404).json({ error: "Not found" });

    await leave.update({ trash: true });
    res.status(200).json("Successfully deleted");
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Failed to delete leave request" });
  }
};
const getStudentsUnderGuardianBySchoolId = async (req, res) => {
  try {
    const school_id = req.params.school_id;
    const user_id = req.user.user_id;
    if (!school_id || !user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const students = await Student.findAll({
      where: { school_id: school_id, guardian_id: user_id, trash: false },
      attributes: ["id", "full_name", "reg_no", "image"],
      include: [
        {
          model: Class,
          attributes: ["id", "classname", "year", "division"],
        },
      ],
    });
    if (!students || students.length === 0) {
      return res.status(404).json({ error: "No students found" });
    }
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};
const getSchoolsByUser = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const schools = await Student.findAll({
      where: { guardian_id: user_id, trash: false },
      attributes: ["school_id"],
      include: [
        {
          model: School,
          attributes: ["id", "name", "address", "phone", "email"],
        },
      ],
      group: ["school_id"],
    });
    if (!schools || schools.length === 0) {
      console.log("No schools found for the given user ID");
      return null;
    }
    res.status(200).json({
      totalcontent: schools.length,
      schools,
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return null;
  }
};

const getStaffsBySchoolId = async (req, res) => {
  try {
    const school_id = req.params.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || "";
    const role = req.query.role || "teacher";
    if (!school_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    let whereClause = { school_id: school_id, role: role, trash: false };
    if (searchQuery) {
      whereClause[Op.or] = [{ name: { [Op.like]: `%${searchQuery}%` } }];
    }
    const { count, rows: staffs } = await User.findAndCountAll({
      where: whereClause,
      attributes: ["id", "name", "email", "phone", "dp", "role", "createdAt"],
      include: [
        {
          model: Staff,
          attributes: [
            "id",
            "user_id",
            "school_id",
            "class_id",
            "role",
            "qualification",
            "address",
          ],
          include: [
            {
              model: Staffsubject,
              attributes: ["id", "staff_id", "subject_id"],
              include: [
                {
                  model: Subject,
                  attributes: ["id", "subject_name"],
                },
              ],
            },
            {
              model: Class,
              attributes: ["id", "classname", "year", "division"],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
      offset,
      distinct: true, // Add this line
      limit,
    });
    if (!staffs || staffs.length === 0) {
      return res.status(404).json({ error: "No staffs found" });
    }
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      staffs,
    });
  } catch (error) {
    console.error("Error fetching staffs:", error);
    res.status(500).json({ error: "Failed to fetch staffs" });
  }
};
const getTodayTimetableByStudentId = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const class_id = student.class_id;
    const school_id = student.school_id;

    let date = new Date();
    let today = date.getDay();
    let message = "today's timetable";

    // If time >= 19:00 (7PM), shift to tomorrow
    if (date.getHours() >= 19) {
      today = (today + 1) % 7;
      date.setDate(date.getDate() + 1); // Move to next day
      message = "tomorrow's timetable";
    }

    const timetable = await Timetable.findAll({
      where: {
        class_id,
        school_id,
        day_of_week: today,
      },

      order: [["period_number", "ASC"]],
      include: [
        { model: User, attributes: ["id", "name"] },
        { model: Subject, attributes: ["id", "subject_name"] }, // optional
        { model: Class, attributes: ["id", "classname"] }, // optional
      ],
    });
    //the class id used TimetableSubstitution get the substitutions for today
    const substitutions = await TimetableSubstitution.findAll({
      where: { date },
      include: [
        {
          model: Timetable,
          where: { class_id: class_id },
          attributes: ["id", "day_of_week", "class_id", "period_number"],
          required: true,
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
        {
          model: Subject,
          attributes: ["id", "subject_name"],
        },
      ],
    });

    return res.json({
      message: `Here is ${message}`,
      today,
      timetable,
      substitutions,
    });
  } catch (error) {
    console.error("getTodayTimetableForStaff error:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getAllDayTimetableByStudentId = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    const class_id = student.class_id;
    const school_id = student.school_id;
    const timetable = await Timetable.findAll({
      where: {
        class_id,
        school_id,
      },
      attributes: [
        "id",
        "day_of_week",
        "period_number",
        "subject_id",
        "staff_id",
        "createdAt",
      ],
      order: [
        ["day_of_week", "ASC"],
        ["period_number", "ASC"],
      ],
      include: [
        { model: User, attributes: ["id", "name"] },
        { model: Subject, attributes: ["id", "subject_name"] }, // optional
        { model: Class, attributes: ["id", "classname"] }, // optional
      ],
    });
    const grouped = timetable.reduce((acc, entry) => {
      const day = entry.day_of_week;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(entry);
      return acc;
    }, {});

    // Convert grouped object to array with "day_of_week" key
    const formatted = Object.keys(grouped).map((day) => ({
      day_of_week: parseInt(day),
      periods: grouped[day],
    }));

    return res.json({
      student_id,
      class_id,
      school_id,
      timetable: formatted,
    });
  } catch (error) {
    console.error("getAllDayTimetableByStudentId error:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getNavigationBarCounts = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;

    const unreadChatCount = await Chat.findAll({
      where: {
        [Op.or]: [{ user1_id: user_id }, { user2_id: user_id }],
      },
      include: [
        {
          model: Message,
          attributes: ["id", "receiver_id", "status"],
          where: { status: { [Op.ne]: "read" }, trash: false },
        },
      ],
    });
    res.json({
      unreadChatCount: unreadChatCount.length,
    });
  } catch (error) {
    console.error(
      "Error fetching pending leave request counts by role:",
      error
    );
    res
      .status(500)
      .json({ error: "Failed to fetch pending leave request counts" });
  }
};
// Update guardian profile details from guardian table
const updateProfileDetails = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      guardian_relation,
      guardian_name,
      guardian_contact,
      guardian_job,
      guardian2_relation,
      guardian2_name,
      guardian2_job,
      guardian2_contact,
      father_name,
      mother_name,
    } = req.body;
    const guardian = await Guardian.findOne({
      where: { user_id: userId },
    });

    if (!guardian) return res.status(404).json({ error: "Guardian not found" });
    if (guardian_contact) {
      const existingPhone = await User.findOne({
        where: {
          phone: guardian_contact,
          id: { [Op.ne]: userId },
        },
      });

      if (existingPhone) {
        return res
          .status(400)
          .json({ error: "Guardian phone already exists in user table" });
      }
      await User.update({ phone: guardian_contact }, { where: { id: userId } });
    }

    await guardian.update({
      guardian_relation,
      guardian_name,
      guardian_contact,
      guardian_job,
      guardian2_relation,
      guardian2_name,
      guardian2_job,
      guardian2_contact,
      father_name,
      mother_name,
    });
    res.status(200).json({ message: "Guardian profile updated", guardian });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getProfileDetails = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const guardian = await Guardian.findOne({
      where: { user_id: user_id },
      attributes: [
        "guardian_name",
        "guardian_contact",
        "guardian_email",
        "guardian_job",
        "guardian_relation",
        "guardian2_name",
        "guardian2_contact",
        "guardian2_job",
        "guardian2_relation",
        "father_name",
        "mother_name",
      ],
    });
    if (!guardian) return res.status(404).json({ error: "Guardian not found" });
    const user = await User.findOne({
      where: { id: user_id },
      attributes: ["name", "email", "phone", "dp"],
    });

    res
      .status(200)
      .json({ message: "Guardian profile details", guardian, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getHomeworkById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const homework = await Homework.findOne({
      where: { id, school_id, trash: false },

      include: [
        {
          model: HomeworkAssignment,
          attributes: ["id", "remarks", "points", "solved_file"],
          include: [
            {
              model: HomeworkAssignment,
              attributes: ["id", "remarks", "points", "solved_file"],

              include: [
                {
                  model: Student,
                  attributes: [
                    "id",
                    "reg_no",
                    "full_name",
                    "image",
                    "roll_number",
                  ],
                },
              ],
            },
            {
              model: Class,
              attributes: ["id", "classname"],
            },
            {
              model: Subject,
              attributes: ["id", "subject_name"],
            },
          ],
        },
      ],
    });

    if (!homework) return res.status(404).json({ error: "Not found" });
    res.status(200).json(homework);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAchievementById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const achievement = await Achievement.findOne({
      where: { id: req.params.id, school_id, trash: false },
      attributes: [
        "id",
        "title",
        "description",
        "category",
        "level",
        "date",
        "awarding_body",
      ],
      include: [
        {
          model: StudentAchievement,
          attributes: ["student_id", "status", "proof_document", "remarks"],
          include: [
            {
              model: Student,
              attributes: ["id", "full_name", "reg_no", "image"],
            },
          ],
        },
        {
          model: Class,
          attributes: ["id", "classname", "year", "division"],
        },
      ],
    });
    res.status(200).json(achievement);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  updateHomeworkAssignment,

  getSchoolIdByStudentId,

  getNoticeByStudentId,
  getPaymentByStudentId,
  getInvoiceByStudentId,

  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest,

  getStudentsUnderGuardianBySchoolId,
  getSchoolsByUser,
  getStaffsBySchoolId,

  getTodayTimetableByStudentId,
  getAllDayTimetableByStudentId,

  getNavigationBarCounts,

  updateProfileDetails,
  getProfileDetails,

  getHomeworkById,
  getAchievementById,
};
