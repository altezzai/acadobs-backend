const moment = require("moment");
const bcrypt = require("bcrypt");
const { Op, where } = require("sequelize");
const logger = require("../utils/logger");
const { schoolSequelize } = require("../config/connection");

const {
  normalizeGender,
  normalizeGuardianRelation,
} = require("../utils/supportingFunction");
const Staff = require("../models/staff");
const StaffPermission = require("../models/staff_permissions");
const StaffSubject = require("../models/staffsubject");
const Class = require("../models/class");
const Subject = require("../models/subject");
const User = require("../models/user");
const Guardian = require("../models/guardian");
const Student = require("../models/student");
const Duty = require("../models/duty");
const DutyAssignment = require("../models/dutyassignment");
const Achievement = require("../models/achievement");
const StudentAchievement = require("../models/studentachievement");
const Message = require("../models/messages");
const Event = require("../models/event");
const Payment = require("../models/payment");
const LeaveRequest = require("../models/leaverequest");
const News = require("../models/news");
const NewsImage = require("../models/newsimage");
const Notice = require("../models/notice");
const NoticeClass = require("../models/noticeclass");
const Timetable = require("../models/timetables");
const TimetableSubstitution = require("../models/timetable_substitutions");
const Attendance = require("../models/attendance");
const AttendanceMarked = require("../models/attendancemarked");
const Invoice = require("../models/invoice");
const InvoiceStudent = require("../models/invoice_students");
const InternalMark = require("../models/internal_marks");
const Marks = require("../models/marks");
const Homework = require("../models/homework");
const HomeworkAssignment = require("../models/homeworkassignment");
const StaffAttendance = require("../models/staff_attendance");
const Syllabus = require("../models/syllabus");
const { School } = require("../models");
const StudentTransfer = require("../models/student_transfer");
const RouteDrivers = require("../models/tracker/route_drivers");
const Stop = require("../models/tracker/stop");
const StopRoute = require("../models/tracker/stop_route");
const Driver  = require("../models/tracker/driver");
const Vehicle  = require("../models/tracker/vehicle");
const Routes = require("../models/tracker/routes");
const StudentsStopStatus = require("../models/tracker/students_stop_status");
const LiveLocation = require("../models/tracker/livelocation");
const { error } = require("winston");
const { Console } = require("winston/lib/winston/transports");
const { deleteFile } = require("../middlewares/storageUploads");
const Exam = require("../models/exams");
const ExamTimetable = require("../models/exam_timetable");
const SpecialClassStudent = require("../models/special_class_students");

// CREATE
const createClass = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { year, division, classname , special} = req.body;
    if (!year || !division || !classname || !school_id) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    const existingClass = await Class.findOne({
      where: {
        classname,
        school_id,
        trash: false,
      },
    });

    if (existingClass) {
      return res.status(409).json({
        message: "Class with same class name already exists in this school.",
      });
    }
    const newClass = await Class.create({
      year,
      division,
      classname,
      school_id,
      special,
    });
    res.status(201).json({ message: "Class created", class: newClass });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error creating class:", error);
    console.error("Error creating class:", error);
    res.status(500).json({ error: error.message });
  }
};

// READ ALL
const getAllClasses = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const year = req.query.year || null;
    const division = req.query.division || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause = {
      school_id: req.user.school_id,
      trash: false,
    };
    if (searchQuery) {
      whereClause.classname = { [Op.like]: `%${searchQuery}%` };
    }
    if (year) {
      whereClause.year = year;
    }
    if (division) {
      whereClause.division = division;
    }

    const { count, rows: classes } = await Class.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      order: [["createdAt", "DESC"]],

    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      classes,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching classes:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

// READ ONE
const getClassById = async (req, res) => {
  try {
    const id = req.params.id;
    const classData = await Class.findOne({
      where: {
        id,
        school_id: req.user.school_id,
      },
    });
    if (!classData) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(classData);
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error fetching class:", error);
    res.status(500).json({ error: error.message });
  }
};
//i want get year and division of class by class id
const getClassesByYear = async (req, res) => {
  try {
    const year = req.params.year;
    const school_id = req.user.school_id;
    const classData = await Class.findAll({
      where: {
        year: year,
        school_id: school_id,
      },
      attributes: ["id", "division", "classname"],
    });

    if (!classData) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(classData);
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error fetching class:", error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
const updateClass = async (req, res) => {
  try {
    const id = req.params.id;
    const { year, division, classname, special } = req.body;
    const updated = await Class.update(
      { year, division, classname, special },
      { where: { id, school_id: req.user.school_id } },
    );
    res.status(200).json({ message: "Class updated", updated });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error updating class:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE (soft delete)
const deleteClass = async (req, res) => {
  try {
    const id = req.params.id;
    const school_id = req.user.school_id;
    const classData = await Class.findOne({
      where: {
        id,
        school_id,
        trash: false,
      },
    });
    if (!classData) return res.status(404).json({ message: "Class not found" });

    await Class.update({ trash: true }, { where: { id, school_id } });
    res.status(200).json({ message: "Class soft-deleted" });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error deleting class:", error);
    res.status(500).json({ error: error.message });
  }
};
const getSpecialClassesByYear = async (req, res) => {
  try {
    const year = req.params.year;
    const school_id = req.user.school_id;
    const classData = await Class.findAll({
      where: {
        year: year,
        school_id: school_id,
        special: true,
      },
      attributes: ["id", "division", "classname"],
    });

    if (!classData) return res.status(404).json({ message: "Special classes not found" });
    res.status(200).json(classData);
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error fetching special classes:", error);
    res.status(500).json({ error: error.message });
  }
};
const getWithOutSpecialClassesByYear = async (req, res) => {
  try {
    const year = req.params.year;
    const school_id = req.user.school_id;
    const classData = await Class.findAll({
      where: {
        year: year,
        school_id: school_id,
        special: false,
      },
      attributes: ["id", "division", "classname"],
    });

    if (!classData) return res.status(404).json({ message: "Special classes not found" });
    res.status(200).json(classData);
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error fetching special classes:", error);
    res.status(500).json({ error: error.message });
  }
};
//get trashed classes
const getTrashedClasses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    let whereClause = {
      trash: true,
      school_id: school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [{ classname: { [Op.like]: `%${searchQuery}%` } }];
    }

    const { count, rows: classes } = await Class.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      order: [["updatedAt", "DESC"]],
    });

    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      classes,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching trashed classes:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const restoreClass = async (req, res) => {
  try {
    const id = req.params.id;
    const school_id = req.user.school_id;
    const classData = await Class.findOne({
      where: {
        id,
        school_id,
        trash: true,
      },
    });
    if (!classData) return res.status(404).json({ message: "Class not found" });
    await Class.update(
      { trash: false },
      {
        where: {
          id,
          school_id,
        },
      },
    );
    res.status(200).json({ message: "Class restored" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error restoring class:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const permanentDeleteClass = async (req, res) => {
  try {
    const id = req.params.id;
    const school_id = req.user.school_id;
    const classData = await Class.findOne({
      where: {
        id,
        school_id,
        trash: true,
      },
    });
    if (!classData) return res.status(404).json({ message: "Class not found" });
    await Class.destroy({ where: { id, school_id } });
    res.status(200).json({ message: "Class permanently deleted" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error permanently deleting class:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
// Create Subject
const createSubject = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const schoolData = await School.findOne({
      where: { id: school_id },
      attributes: ["syllabus_id"],
    });
    const { subject_name, class_range,is_multi_teacher,priority } = req.body;
    if (!subject_name || !class_range || !school_id) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    if (
      class_range !== "FS" &&
      class_range !== "PS" &&
      class_range !== "MS" &&
      class_range !== "SS" &&
      class_range !== "common" &&
      class_range !== "other"
    ) {
      return res.status(400).json({ error: "Invalid class range" });
    }
    const exists = await Subject.findOne({
      where: { subject_name, class_range, school_id, trash: false },
    });

    if (exists) {
      return res.status(400).json({
        error: "Subject already exists for the same class range and school.",
      });
    }

    const subject = await Subject.create({
      subject_name,
      class_range,
      school_id,
      is_multi_teacher,
      syllabus_id: schoolData.syllabus_id,
      priority,
    });
    res.status(201).json(subject);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error creating subject:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
//managing subjects
const getSubjects = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const school_id = req.user.school_id;
    const range = req.query.range || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    let whereClause = {
      trash: false,
      school_id,
    };

    if (searchQuery) {
      whereClause.subject_name = { [Op.like]: `%${searchQuery}%` };
    }

    if (range) {
      whereClause.class_range = range;
    }

    const { count, rows: subjects } = await Subject.findAndCountAll({
      offset,
      distinct: true,
      limit,
      attributes: ["id", "subject_name", "class_range", "is_multi_teacher", "priority"],
      where: whereClause,
      include: [
        {
          model: Syllabus,
          attributes: ["name"],
        },
      ],
      order: [["id", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      subjects,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting subjects:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getSubjectById = async (req, res) => {
  try {
    const id = req.params.id;
    const school_id = req.user.school_id;
    const subject = await Subject.findOne({
      where: {
        id,
        trash: false,
        school_id,
      },
      include: [
        {
          model: Syllabus,
          attributes: ["name"],
        },
      ],
    });
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json(subject);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting subject by ID:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const { subject_name, class_range, is_multi_teacher, priority } = req.body;
    const subject = await Subject.findOne({
      where: {
        id,
        trash: false,
        school_id,
      },
    });
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const exists = await Subject.findOne({
      where: {
        subject_name,
        class_range,
        school_id,
        id: { [require("sequelize").Op.ne]: id },
        trash: false,
      },
    });

    if (exists) {
      return res.status(400).json({
        error: "Another subject with the same details already exists.",
      });
    }

    await subject.update({ subject_name, class_range, school_id, is_multi_teacher ,priority});
    res.status(200).json(subject);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating subject:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

// Delete Subject (Soft Delete)
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const subject = await Subject.findOne({
      where: { id, school_id, trash: false },
    });
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    subject.trash = true;
    await subject.save();

    res.status(200).json({ message: "Subject deleted (soft)" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting subject:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getSubjectsForFilter = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const range = req.query.range || "";
    const school_id = req.user.school_id;
    const is_multi_teacher = req.query.is_multi_teacher || null; 
    const schoolDetails = await School.findOne({
      where: { id: school_id },
      attributes: ["syllabus_id"],
    });
    let whereClause = {
      trash: false,
      syllabus_id: schoolDetails.syllabus_id,
      [Op.or]: [
        { school_id: school_id },
        { school_id: null }, // include global subjects
      ],
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { subject_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (range) {
      whereClause.class_range = range;
    }
    if (is_multi_teacher !== null) {
      whereClause.is_multi_teacher = is_multi_teacher;
    }

    const subjects = await Subject.findAll({
      distinct: true,
      where: whereClause,
      attributes: ["id", "subject_name", "class_range", "is_multi_teacher", "priority"],
    });
    res.status(200).json({
      totalcontent: subjects.length,
      subjects,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting subjects for filter:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getTrashedSubjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    let whereClause = {
      trash: true,
      school_id: school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { subject_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { count, rows: subjects } = await Subject.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Syllabus,
          attributes: ["name"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });
    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      subjects,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting trashed subjects:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
// Restore Subject
const restoreSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const subject = await Subject.findOne({
      where: { id, school_id, trash: true },
    });
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    subject.trash = false;
    await subject.save();

    res.status(200).json({ message: "Subject restored" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error restoring subject:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const permanentDeleteSubject = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { id } = req.params;
    const subject = await Subject.findOne({
      where: { id, school_id, trash: true },
    });
    if (!subject) return res.status(404).json({ error: "Subject not found" });

    await subject.destroy();
    res.status(200).json({ message: "Subject permanently deleted" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error permanently deleting subject:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

const createStaff = async (req, res) => {
  const transaction = await schoolSequelize.transaction();

  try {
    const school_id = req.user.school_id;
    const {
      name,
      email,
      phone,
      role,
      qualification,
      address,
      class_id,
      subjects,
      staff_incharge,
    } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    
    const existingUser = await User.findOne({
      where: { email: email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Staff's email already exists in user table" });
    }
    const existingPhone = await User.findOne({
      where: { phone: phone },
    });
    if (existingPhone) {
      return res
        .status(400)
        .json({ error: "Staff's phone already exists in user table" });
    }
    const staffUrl = req.uploadedFiles?.dp?.url || null;

    const hashedPassword = await bcrypt.hash(phone, 10);
    const user = await User.create(
      {
        name: name,
        email: email,
        phone: phone,
        password: hashedPassword,
        school_id: school_id,
        dp: staffUrl,
        role: role,
        status: "active",
      },
      { transaction },
    );
    const newStaff = await Staff.create(
      {
        school_id,
        user_id: user.id,
        role,
        qualification,
        address,
        dp: staffUrl,
        class_id: class_id || null,
        staff_incharge: staff_incharge || false,
      },
      { transaction },
    );
    if (subjects && Array.isArray(subjects)) {
      const staffSubjectsData = subjects.map((subjId) => ({
        school_id,
        staff_id: newStaff.id,
        subject_id: subjId,
      }));
      await StaffSubject.bulkCreate(staffSubjectsData, {
        transaction,
      });
    }

    const permissionData = { user_id: user.id };
    if (role === "staff") {
    permissionData.leave_request = true;
    await StaffPermission.create(permissionData, { transaction });
    } else if(role === "teacher" && staff_incharge==="true"){
    permissionData.leave_request = true;
    await StaffPermission.create(permissionData, { transaction });
    }
    res.status(201).json(newStaff);
    await transaction.commit();
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error creating staff:", error);
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const school_id = req.user.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const role = req.query.role || "staff"; // 'all' or 'active'
    let whereClause = {
      school_id: school_id,
      trash: false,
    };
    if (role) {
      whereClause.role = role;
    }
    const { count, rows: staff } = await Staff.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp", "role"],
          where: searchQuery
            ? {
                [Op.or]: [
                  { name: { [Op.like]: `%${searchQuery}%` } },
                  { phone: { [Op.like]: `%${searchQuery}%` } },
                ],
              }
            : {},
        },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "ASC"],
      ],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      staff,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting all staff:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getStaffById = async (req, res) => {
  try {
    const { staff_id } = req.params;
    const school_id = req.user.school_id;
    const staff = await Staff.findOne({
      where: {
        id: staff_id,
        trash: false,
        school_id: school_id,
      },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp"],
        },
        {
          model: Class,
          attributes: ["id", "year", "division", "classname"],
        },
        {
          model: StaffSubject,
          include: [
            {
              model: Subject,
              attributes: ["id", "subject_name"],
            },
          ],
        },
      ],
    });
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    res.status(200).json(staff);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting staff by ID:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getStaffs = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const users = await User.findAll({
      where: {
        school_id: school_id,
        role: { [Op.in]: ["teacher", "staff"] },
        trash: false,
      },
      attributes: ["id", "name", "email", "dp"],
      order: [["name", "ASC"]],
    });

    res.status(200).json(users);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting staffs:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const updateStaff = async (req, res) => {
  const transaction = await Staff.sequelize.transaction();

  try {
    const { staff_id } = req.params;
    const school_id = req.user.school_id;
    const { name,role, qualification, address, class_id, subjects, staff_incharge } = req.body;

    const staff = await Staff.findOne({
      where: { id: staff_id, school_id },
    });
    if (!staff || staff.trash) {
      await transaction.rollback();
      return res.status(404).json({ error: "Staff not found" });
    }

    const user = await User.findByPk(staff.user_id);
    let finalDp = user.dp;
    const newDpUrl = req.uploadedFiles?.dp?.url || null;
    if (newDpUrl) {
      if (user.dp) {
        await deleteFile(user.dp);
      }
      finalDp = newDpUrl;
    }
  
    if (staff_incharge === "true" && staff.staff_incharge !== "true") {
      const staffPermission = await StaffPermission.findOne({
        where: {
          user_id: staff.user_id,
        },
      });
      if (!staffPermission) {
        await StaffPermission.create({
          user_id: staff.user_id,
          leave_request: true,
        }, { transaction });
      }
    }
    await staff.update(
      { role, qualification, address, class_id, dp: finalDp, staff_incharge },
      { transaction },
    );

    await user.update(
      {
        role,
        name,
        dp: finalDp,
      },
      { transaction },
    );

    if (subjects && Array.isArray(subjects)) {
      const existingSubjects = await StaffSubject.findAll({
        where: { staff_id },
        attributes: ["subject_id"],
        raw: true,
        transaction,
      });

      const existingSubjectIds = existingSubjects.map((s) => s.subject_id);
      const newSubjectIds = subjects.map((s) => Number(s));

      const toAdd = newSubjectIds.filter(
        (id) => !existingSubjectIds.includes(id),
      );
      const toRemove = existingSubjectIds.filter(
        (id) => !newSubjectIds.includes(id),
      );
      if (toAdd.length > 0) {
        const insertData = toAdd.map((id) => ({
          school_id,
          staff_id,
          subject_id: id,
        }));
        await StaffSubject.bulkCreate(insertData, { transaction });
      }

      if (toRemove.length > 0) {
        await StaffSubject.destroy({
          where: {
            staff_id,
            subject_id: toRemove,
          },
          transaction,
        });
      }
    }
    await transaction.commit();

    res.status(200).json({ message: "Staff updated successfully", staff });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating staff:",
      error,
    );
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};
const updateStaffUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const school_id = req.user.school_id;
    const { name, email, phone, role } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    // const file = req.file;
    const existingUser = await User.findOne({
      where: { email: email, id: { [Op.ne]: user_id } },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "SchoolAdmin email already exists in user table" });
    }
    const existingPhone = await User.findOne({
      where: { phone: phone, school_id, id: { [Op.ne]: user_id } },
    });
    if (existingPhone) {
      return res
        .status(400)
        .json({ error: "SchoolAdmin phone already exists in user table" });
    }
    const user = await User.findOne({
      where: { id: user_id },
    });
    const newDpUrl = req.uploadedFiles?.dp?.[0]?.url || null;
    let finalDp = user.dp;

    if (newDpUrl) {
      if (user.dp) {
        await deleteFile(user.dp);
      }
      finalDp = newDpUrl;
    }
    const hashedPassword = await bcrypt.hash(phone, 10);
    await user.update({
      name: name,
      email: email,
      phone: phone,
      password: hashedPassword,
      school_id: school_id,
      dp: finalDp,
      role: role,
      status: "active",
    });

    res.status(200).json(user);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating staff user:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { staff_id } = req.params;
    const school_id = req.user.school_id;
    const staff = await Staff.findOne({
      where: { id: staff_id, school_id, trash: false },
    });
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    const user = await User.findByPk(staff.user_id);
    if (!user && user.trash)
      return res.status(404).json({ error: "user not found" });

    await staff.update({ trash: true });
    await user.update({ trash: true });
    res.status(200).json({ message: "Staff deleted (soft)" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting staff:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const restoredStaff = async (req, res) => {
  try {
    const { staff_id } = req.params;
    const school_id = req.user.school_id;
    const staff = await Staff.findOne({
      where: { id: staff_id, school_id, trash: true },
    });
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    const user = await User.findByPk(staff.user_id);
    if (!user && user.trash)
      return res.status(404).json({ error: "user not found" });

    await staff.update({ trash: false });
    await user.update({ trash: false });
    res.status(200).json({ message: "successfully restored staff " });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error restoring staff:",
      error,
    )
    res.status(500).json({ error: error.message });
  }
};
const getTrashedStaffs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const role = req.query.role || ""; // 'all' or 'active'
    let whereClause = {
      trash: true,
      school_id: school_id,
    };
    if (role) {
      whereClause.role = role;
    }

     const { count, rows: staff } = await Staff.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp", "role"],
          where: searchQuery
            ? {
                [Op.or]: [
                  { name: { [Op.like]: `%${searchQuery}%` } },
                  { phone: { [Op.like]: `%${searchQuery}%` } },
                ],
              }
            : {},
        },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "ASC"],
      ],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      staff,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting trashed staffs:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const permanentDeleteStaff = async (req, res) => {
    const transaction = await schoolSequelize.transaction();
  try {
    const { staff_id } = req.params;
    const school_id = req.user.school_id; 
    const user_id = req.user.user_id;
    const role = req.user.role;
    const strictDelete = req.user.strict_delete;
    if (role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const staff = await Staff.findOne({
      where: { id: staff_id, school_id, trash: true },
      transaction,
    },
   );
   const internal= await InternalMark.findOne({
    where: { recorded_by: staff.user_id },
    transaction,
   })
    if(internal && strictDelete !=="true"){
      await transaction.rollback();
      return res.status(400).json({ error: "Unable to delete this user because other records are linked to this account." });
    }
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    const user = await User.findByPk(staff.user_id, { transaction });
    if (!user) return res.status(404).json({ error: "user not found" });

    const dutyAssignments = await DutyAssignment.findAll({
      where: { staff_id: staff.user_id },
      transaction,
    });
    for (const assignment of dutyAssignments) {
      if (assignment.solved_file) {
        await deleteFile(assignment.solved_file);
      }
    }
    await DutyAssignment.destroy({ where: { staff_id: staff.user_id }, transaction });

    const leaveRequests = await LeaveRequest.findAll({
      where: {
        user_id: staff.user_id,
        role: { [Op.in]: ["teacher", "staff"] },
      },
      transaction,
    });
    for (const leave of leaveRequests) {
      if (leave.attachment) {
        await deleteFile(leave.attachment);
      }
    }
    await LeaveRequest.destroy({
      where: {
        user_id: staff.user_id,
        role: { [Op.in]: ["teacher", "staff"] },
      },
      transaction,
    });

    const staffAttendance = await StaffAttendance.destroy({ where: { staff_id: staff.user_id }, transaction });
    const staffPermission = await StaffPermission.destroy({ where: { user_id: staff.user_id }, transaction });
    const staffSubject = await StaffSubject.destroy({ where: { staff_id: staff.id }, transaction });
    await staff.destroy({ transaction });
    
    const toaday = new Date(); 
    const date = toaday.getDate() + "-" + (toaday.getMonth() + 1) + "-" + toaday.getFullYear();
    const deleted_phone = user.phone;
    const phone = `${staff_id}/${user_id}/${date}`;
    await user.update({ phone, deleted_phone, trash: true }, { transaction });
   
    await transaction.commit();
    res.status(200).json({ message: "Staff deleted (permanent)" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting staff:",
      error,
    );
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

const getAllTeachers = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const subject = req.query.subject || "";
    const school_id = req.user.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause = {
      school_id: school_id,
      trash: false,
      role: "teacher",
    };

    const { count, rows: staff } = await Staff.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp", "role"],
          where: searchQuery
            ? {
                name: { [Op.like]: `%${searchQuery}%` },
              }
            : {},
        },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
        {
          model: StaffSubject,
          include: [
            {
              model: Subject,
              attributes: ["id", "subject_name"],
              where: {
                trash: false,
                subject_name: {
                  [Op.like]: `%${subject}%`,
                },
              },
            },
          ],
        },
      ],

      order: [
        ["createdAt", "DESC"],
        ["id", "ASC"],
      ],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      staff,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting all teachers:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

// READ all staff permissions
const getAllStaffPermissions = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause = {
      school_id: school_id,
      trash: false,
    };
    if (searchQuery) {
      whereClause.name = { [Op.like]: `%${searchQuery}%` };
    };

    const { count, rows: data } = await StaffPermission.findAndCountAll({
      offset,
      distinct: true,
      limit,
      include: [
        {
          model: User,
          where : whereClause,
          attributes: ["id", "name", "email", "phone", "dp", "school_id"],
        },
      ],
      order: [
        ["createdAt", "DESC"],
      ],
    });
    res.json({ 
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data
     });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting staff permissions:",
      error,
    );
    res.status(500).json({ error: "Failed to fetch staff permissions" });
  }
};

// READ single staff permission
const getStaffPermissionByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const school_id = req.user.school_id;
    const permission = await StaffPermission.findOne({
      where: { user_id },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp", "school_id"],
          where: { school_id },
        },
      ],
    });

    if (!permission) {
      return res.status(404).json({ error: "Permissions not found" });
    }

    res.json({ success: true, data: permission });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting staff permission:",
      error,
    );
    res.status(500).json({ error: "Failed to fetch staff permission" });
  }
};

// UPDATE staff permission
const updateStaffPermission = async (req, res) => {
  try {
    const { user_id } = req.params;
    const school_id = req.user.school_id;
    const {
      attendance,
      timetable,
      marks,
      students,
      homeworks,
      parent_notes,
      achievements,
      student_leave_request,
      teachers,
      teachers_leaveReuest,
      teachers_duties,
      teachers_attendance,
      staffs,
      staffs_leaveReuest,
      staffs_duties,
      staffs_attendance,
      chats,
      reports,
      payments,
      alumni,
      events,
      news,
      notice,
      exam,
      transportation,
      aiAnalytics,
    } = req.body;
    const permission = await StaffPermission.findOne({
      where: { user_id },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp", "school_id"],
          where: { school_id },
        },
      ],
    });
    if (!permission) {
      return res.status(404).json({ error: "Permissions not found" });
    }

    await permission.update({
      attendance,
      timetable,
      marks,
      students,
      homeworks,
      parent_notes,
      achievements,
      student_leave_request,
      chats,
      reports,
      payments,
      alumni,
      events,
      news,
      notice,
      exam,
      transportation,
      teachers,
      teachers_leaveReuest,
      teachers_duties,
      teachers_attendance,
      staffs,
      staffs_leaveReuest,
      staffs_duties,
      staffs_attendance,
      aiAnalytics,attendance,
      timetable,
      marks,
      students,
      homeworks,
      parent_notes,
      achievements,
      student_leave_request,
      teachers,
      teachers_leaveReuest,
      teachers_duties,
      teachers_attendance,
      staffs,
      staffs_leaveReuest,
      staffs_duties,
      staffs_attendance,
      chats,
      reports,
      payments,
      alumni,
      events,
      news,
      notice,
      exam,
      transportation,
      aiAnalytics,
    });
    res.json({ success: true, data: permission });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating staff permission:",
      error,
    );
    res.status(500).json({ error: "Failed to update staff permission" });
  }
};

// DELETE staff permission
const deleteStaffPermission = async (req, res) => {
  try {
    const { user_id } = req.params;
    const school_id = req.user.school_id;
    const permission = await StaffPermission.findOne({
      where: { user_id },
      include: [
        {
          model: User,
          attributes: ["id", "school_id"],
          where: { school_id , role:"teacher" },
        },
      ],
    });

    if (!permission) {
      return res.status(404).json({ error: "Permissions not found" });
    }

    await permission.destroy();
    res.json({ success: true, message: "Staff permission deleted successfully" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting staff permission:",
      error,
    );
    res.status(500).json({ error: "Failed to delete staff permission" });
  }
};

const createGuardian = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const {
      guardian_relation,
      guardian_name,
      guardian_contact,
      guardian_email,
      guardian_job,
      guardian2_relation,
      guardian2_name,
      guardian2_job,
      guardian2_contact,
      father_name,
      mother_name,
      house_name,
      street,
      city,
      landmark,
      district,
      state,
      country,
      post,
      pincode,
    } = req.body;
    if (!guardian_name || !guardian_contact) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    let existingUser = null;
    if (guardian_email && guardian_email !== "") {
      existingUser = await User.findOne({
        where: { email: guardian_email },
      });
    }
    const existingPhone = await User.findOne({
      where: { phone: guardian_contact },
    });

    if (existingUser && guardian_email !== "") {
      return res
        .status(400)
        .json({ error: "guardian email already exists in user table" });
    }
    if (existingPhone) {
      return res
        .status(400)
        .json({ error: "guardian phone already exists in user table" });
    }
    const fileUrl = req.uploadedFiles?.dp?.url || null;

    const hashedPassword = await bcrypt.hash(guardian_contact, 10);

    const user = await User.create({
      role: "guardian",
      name: guardian_name,
      email: guardian_email || null,
      phone: guardian_contact,
      dp: fileUrl || null,
      school_id: school_id,
      status: "active",
      password: hashedPassword,
    });

    const guardian = await Guardian.create({
      user_id: user.id,
      guardian_relation,
      guardian_name,
      guardian_contact: normalizeGuardianRelation(guardian_relation),
      guardian_email,
      guardian_job,
      guardian2_relation: normalizeGuardianRelation(guardian2_relation),
      guardian2_name,
      guardian2_job,
      guardian2_contact,
      father_name,
      mother_name,
      house_name,
      street,
      city,
      landmark,
      district,
      state,
      country,
      post,
      pincode,
    });

    res.status(201).json({ success: true, data: guardian, user: user });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error creating guardian:",
      error,
    );
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const createGuardianService = async (guardianData, fileBuffer, req) => {
  try {
    const {
      school_id,
      guardian_relation,
      guardian_name,
      guardian_contact,
      guardian_email,
      guardian_job,
      guardian2_relation,
      guardian2_name,
      guardian2_job,
      guardian2_contact,
      father_name,
      mother_name,
      house_name,
      street,
      city,
      landmark,
      district,
      state,
      country,
      post,
      pincode,
      dp,
    } = guardianData;

    if (!guardian_name || !guardian_contact) {
      throw new Error("Required guardian fields are missing");
    }

    const existingUser = await User.findOne({
      where: { phone: guardian_contact },
    });

    if (existingUser) {
      throw new Error("Guardian phone already exists");
    }
    const contactStr = String(guardian_contact);

    const password = guardian_name.slice(0, 3) + contactStr.slice(0, 5);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      role: "guardian",
      name: guardian_name,
      email: guardian_email || null,
      phone: guardian_contact,
      dp: dp,
      school_id,
      status: "active",
      password: hashedPassword,
    });

    await Guardian.create({
      user_id: user.id,
      guardian_relation: normalizeGuardianRelation(guardian_relation),
      guardian_name,
      guardian_contact,
      guardian_email,
      guardian_job,
      guardian2_relation: normalizeGuardianRelation(guardian2_relation),
      guardian2_name,
      guardian2_job,
      guardian2_contact,
      father_name,
      mother_name,
      house_name,
      street,
      city,
      landmark,
      district,
      state,
      country,
      post,
      pincode,
    });

    return user.id;
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error creating guardian service:", error);
    throw error;
  }
};
const getAllGuardians = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const school_id = req.user.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: guardians } = await Guardian.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        guardian_name: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },
      include: [
        {
          model: User,
          attributes: ["name", "email", "phone", "dp"],
          where: { school_id },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      guardians,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting guardians:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getGuardianById = async (req, res) => {
  try {
    const { id } = req.params;
    const guardians = await Guardian.findOne({
      where: {
        id,
        trash: false,
      },
    });
    res.status(200).json(guardians);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting guardians:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

const updateGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const {
      guardian_relation,
      guardian_name,
      guardian_contact,
      guardian_email,
      guardian_job,
      guardian2_relation,
      guardian2_name,
      guardian2_job,
      guardian2_contact,
      father_name,
      mother_name,
      house_name,
      street,
      city,
      landmark,
      district,
      state,
      country,
      post,
      pincode,
    } = req.body;
    const guardian = await Guardian.findOne({
      where: { id, trash: false },
      include: [{ model: User, where: { school_id } }],
    });

    if (!guardian) return res.status(404).json({ error: "Guardian not found" });

    if (guardian_contact) {
      const existingPhone = await User.findOne({
        where: {
          phone: guardian_contact,
          school_id,
          id: { [Op.ne]: guardian.user_id },
        },
      });
      if (existingPhone) {
        return res
          .status(400)
          .json({ error: "Guardian phone already exists in user table" });
      }
    }
    if (guardian_email) {
      const existingUser = await User.findOne({
        where: {
          email: guardian_email,
          id: { [Op.ne]: guardian.user_id },
        },
      });
      if (existingUser && guardian_email !== "") {
        return res
          .status(400)
          .json({ error: "Guardian email already exists in user table" });
      }
    }

    await guardian.update({
      guardian_relation: normalizeGuardianRelation(guardian_relation),
      guardian_name,
      guardian_contact,
      guardian_email,
      guardian_job,
      guardian2_relation: normalizeGuardianRelation(guardian2_relation),
      guardian2_name,
      guardian2_job,
      guardian2_contact,
      father_name,
      mother_name,
      house_name,
      street,
      city,
      landmark,
      district,
      state,
      country,
      post,
      pincode,
    });

    const user = await User.findOne({
      where: { id: guardian.user_id },
    });
    if (!user) return res.status(404).json({ error: "user not found" });
    let fileName = user.dp;
    const fileUrl = req.uploadedFiles?.dp?.url || null;
    if (fileUrl) {
      fileName = fileUrl;
    }
    await user.update({
      name: guardian.guardian_name,
      email: guardian.guardian_email,
      phone: guardian.guardian_contact,
      dp: fileName,
    });
    //
    res.status(200).json(guardian);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating guardian:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const deleteGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const guardian = await Guardian.findOne({
      where: { id, trash: false },
      include: [{ model: User, where: { school_id } }],
    });
    if (!guardian) return res.status(404).json({ error: "Guardian not found" });

    await guardian.update({ trash: true });
    res.status(200).json({ message: "Guardian moved to trash." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getGuardianBySchoolId = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const guardians = await User.findAll({
      offset,
      distinct: true,
      limit,
      where: {
        school_id,
        role: "guardian",
        trash: false,
      },
      attributes: ["id", "name", "email", "phone", "dp"],
    });
    const totalPages = Math.ceil(guardians.length / limit);
    res.status(200).json({
      totalcontent: guardians.length,
      totalPages,
      currentPage: page,
      guardians,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting guardians:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const updateGuardianUserPassword = async (req, res) => {
  try {
    const id = req.params.user_id;
    const school_id = req.user.school_id;

    const { newPassword } = req.body;
    const user = await User.findOne({
      where: { id, school_id },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating guardian user password:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
// Create Student
const createStudent = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const {
      reg_no,
      roll_number,
      full_name,
      date_of_birth,
      gender,
      class_id,
      address,
      admission_date,
      second_language,
      status,

      guardian_contact,
      guardian_name,
      guardian_job,
      guardian2_name,
      guardian2_relation,
      guardian2_contact,
      guardian2_job,
      father_name,
      mother_name,

      house_name,
      street,
      city,
      landmark,
      district,
      state,
      country,
      post,
      pincode,

      update_roll_number,
    } = req.body;
    const guardian_email = req.body.guardian_email || null;
    const guardian_relation = req.body.guardian_relation || "father";

    if (
      !guardian_contact ||
      !full_name ||
      !reg_no ||
      !class_id ||
      !roll_number
    ) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    const normalizedRollNumber = Number(roll_number);
    if (!Number.isInteger(normalizedRollNumber) || normalizedRollNumber < 1) {
      return res.status(400).json({ error: "Roll number must be a positive integer" });
    }

    const existingUser = await User.findOne({
      where: { phone: guardian_contact },
    });
    const existingRegNo = await Student.findOne({
      where: { reg_no, school_id },
    });

    if (existingRegNo) {
      return res.status(400).json({
        error:
          "Reg number already exists in student table" +
          `, Reg No: ${existingRegNo.reg_no}: `,
      });
    }
    const existingRollNumber = await Student.findOne({
      where: {
        roll_number: normalizedRollNumber,
        school_id,
        class_id,
        trash: false,
      },
    });
    if (existingRollNumber && update_roll_number !== "true") {
      return res.status(400).json({
        error: "Roll number already exists in student table for this class",
      });
    }
    if (existingRollNumber && update_roll_number === "true") {
      const studentsToShift = await Student.findAll({
        where: {
          school_id,
          class_id,
          trash: false,
          roll_number: { [Op.gte]: normalizedRollNumber },
        },
      });

      await Promise.all(
        studentsToShift.map((student) =>
          student.update({
            roll_number: Number(student.roll_number) + 1,
          }),
        ),
      );
    }

    let guardianUserId;
    const guardianDpUrl = req.uploadedFiles?.dp?.[0]?.url || null;
    const studentImageUrl = req.uploadedFiles?.image?.[0]?.url || null;

    if (existingUser) {
      if (existingUser.role === "guardian") {
        const existingGuardian = await Guardian.findOne({
          where: { user_id: existingUser.id },
        });

        if (!existingGuardian) {
          return res
            .status(400)
            .json({ error: "User exists but no guardian record found." });
        }
        guardianUserId = existingUser.id;
      } else {
        return res.status(400).json({
          error:
            "User already exists. user is a " +
            existingUser.role +
            ", Phone: " +
            existingUser.phone,
        });
      }
    } else {
      if (guardian_email) {
        const existingEmail = await User.findOne({
          where: { email: guardian_email },
        });
        if (existingEmail && guardian_email !== "") {
          return res.status(400).json({
            error: "Guardian email already exists with other phone number",
          });
        }
      }
      if (!guardian_name || !guardian_contact || !guardian_relation) {
        return res
          .status(400)
          .json({ error: "Required fields are missing for guardian data" });
      }

      const guardianData = {
        school_id,
        guardian_email,
        guardian_name,
        guardian_contact,
        guardian_relation: guardian_relation ? guardian_relation : "father",
        guardian_job,
        guardian2_name,
        guardian2_relation: guardian2_relation ? guardian2_relation : "mother",
        guardian2_contact,
        guardian2_job,
        father_name,
        mother_name,
        school_id,
        house_name,
        street,
        city,
        landmark,
        district,
        state,
        country,
        post,
        pincode,
        dp: guardianDpUrl,
      };

      const newGuardian = await createGuardianService(
        guardianData,
        // guardianDpFile,
      );
      guardianUserId = newGuardian;
    }
    let fileName = null;
    if (studentImageUrl) {
      fileName = studentImageUrl;
    }

    const student = await Student.create({
      school_id,
      guardian_id: guardianUserId,
      reg_no,
      roll_number,
      full_name,
      date_of_birth,
      gender: normalizeGender(gender),
      class_id,
      admission_date,
      address,
      second_language,
      status,
      image: fileName ? fileName : null,
    });

    res.status(201).json({ success: true, student });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error creating student:",
      error,
    );
    console.error("Error creating student:", error);
    res.status(500).json({ error: "Failed to create student" });
  }
};
const bulkCreateStudents = async (req, res) => {
  const transaction = await schoolSequelize.transaction();
  try {
    const school_id = req.user.school_id;
    const studentsData = req.body.students;
    const class_id = req.body.class_id;
    // expect array
    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      return res.status(400).json({ error: "No students provided" });
    }
    if (!class_id) {
      return res.status(400).json({ error: "Class ID is required" });
    }

    const createdStudents = [];

    for (const studentObj of studentsData) {
      const {
        reg_no,
        roll_number,
        full_name,
        date_of_birth,
        gender,
        address,
        admission_date,
        status,
        second_language,

        // guardian
        guardian_email,
        guardian_name,
        guardian_contact,
        guardian_relation,
        guardian_job,
        guardian2_name,
        guardian2_relation,
        guardian2_contact,
        guardian2_job,
        father_name,
        mother_name,

        house_name,
        street,
        city,
        landmark,
        district,
        state,
        country,
        post,
        pincode,
      } = studentObj;

      if (!guardian_contact || !full_name || !reg_no || !roll_number) {
        throw new Error("Required fields missing for student: " + full_name);
      }

      // ✅ Check duplicate roll_number in same class
      const existingRoll = await Student.findOne({
        where: { roll_number, school_id, class_id, trash: false },
        transaction,
      });
      if (existingRoll) {
        throw new Error(
          `Roll number ${roll_number} already exists for class ${class_id}`,
        );
      }

      // ✅ Check duplicate reg_no
      const existingReg = await Student.findOne({
        where: { reg_no, school_id },
        transaction,
      });
      if (existingReg) {
        throw new Error(`Reg No ${reg_no} already exists`);
      }

      // ✅ Guardian handling
      let guardianUserId;
      const existingUser = await User.findOne({
        where: { phone: guardian_contact },
        transaction,
      });

      if (existingUser) {
        if (existingUser.role === "guardian") {
          const existingGuardian = await Guardian.findOne({
            where: { user_id: existingUser.id },
            transaction,
          });
          if (!existingGuardian) {
            throw new Error(
              `Guardian user exists but no guardian record found for phone ${guardian_contact}`,
            );
          }
          guardianUserId = existingGuardian.user_id;
        } else {
          return res.status(400).json({
            error: "User already exists and user is a " + existingUser.role,
          });
        }
      } else {
        if (guardian_email) {
          const existingEmail = await User.findOne({
            where: { email: guardian_email },
            transaction,
          });
          if (existingEmail && guardian_email !== "") {
            return res.status(400).json({
              error: `Guardian email  ${existingEmail.email} already exists with other phone number`,
            });
          }
        }

        if (!guardian_name || !guardian_contact) {
          return res.status(400).json({
            error: `Required guardian fields missing for student: ${full_name}'s guardian details`,
          });
        }

        const guardianData = {
          school_id,
          guardian_email: guardian_email ? guardian_email : null,
          guardian_name,
          guardian_contact,
          guardian_relation: guardian_relation ? guardian_relation : "father",
          guardian_job,
          guardian2_name,
          guardian2_relation: guardian2_relation
            ? guardian2_relation
            : "mother",
          guardian2_contact,
          guardian2_job,
          father_name,
          mother_name,
          school_id,
          house_name,
          street,
          city,
          landmark,
          district,
          state,
          country,
          post,
          pincode,
        };

        // Guardian dp upload (if any) -> expect req.files keyed by something like `dp_${index}`
        const guardianDpFile = req.files?.[`dp_${roll_number}`]?.[0];

        const newGuardianId = await createGuardianService(
          guardianData,
          guardianDpFile,
          transaction,
        );
        guardianUserId = newGuardianId;
      }
      createdStudents.push({
        school_id,
        guardian_id: guardianUserId,
        reg_no,
        roll_number,
        full_name,
        date_of_birth,
        gender: normalizeGender(gender),
        class_id,
        admission_date: admission_date ? admission_date : null,
        address,
        status,
        second_language,
        // image: fileName,
      });
    }

    const inserted = await Student.bulkCreate(createdStudents, { transaction });

    await transaction.commit();
    return res.status(201).json({
      success: true,
      count: inserted.length,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error bulk creating students:",
      error,
    );
    await transaction.rollback();
    console.error("Error bulk creating students:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getAllStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const classId = req.query.class_id;
    const year = req.query.year;

    const whereClause = {
      trash: false,
      school_id,
      alumni: false,
    };
    const classWhereClause = {}
    if (searchQuery) {

      whereClause[Op.or] = [
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
        { full_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (classId) {
      whereClause.class_id = classId;
    }
    if (year) {
      classWhereClause.year = year;
    }


    const { count, rows: students } = await Student.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,

      include: [
        { model: User, attributes: ["name", "email", "phone", "dp"] },
        {
          model: Class,
          attributes: ["id", "year", "division", "classname"],
          where: classWhereClause
        },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "ASC"],
      ],
    });

    const totalPages = Math.ceil(count / limit);
    res
      .status(200)
      .json({ totalcontent: count, totalPages, currentPage: page, students });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching students:",
      error,
    );
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const student = await Student.findOne({
      where: { id, school_id, trash: false },

      include: [
        {
          model: User,
          attributes: ["name", "email", "phone", "dp"],

          include: [
            {
              model: Guardian,
              attributes: [
                "guardian_relation",
                "guardian_name",
                "guardian_contact",
                "guardian_email",
                "guardian_job",
                "guardian2_relation",
                "guardian2_name",
                "guardian2_job",
                "guardian2_contact",
                "father_name",
                "mother_name",
                "house_name",
                "street",
                "city",
                "landmark",
                "district",
                "state",
                "country",
                "post",
                "pincode",
              ],
            },
          ],
        },

        {
          model: Class,
          attributes: ["id", "year", "division", "classname"],
        },
      ],
    });

    if (!student) return res.status(404).json({ error: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting student:",
      error,
    );
    console.error("Error getting student:", error);
    res.status(500).json({ error: "Failed to get student" });
  }
};
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const {
      reg_no,
      roll_number,
      full_name,
      date_of_birth,
      gender,
      class_id,
      address,
      admission_date,
      status,
      second_language,
      alumni,

      // Guardian fields
      guardian_name,
      guardian_contact,
      guardian_email,
      guardian_relation,
      guardian_job,
      guardian2_name,
      guardian2_relation,
      guardian2_contact,
      guardian2_job,
      father_name,
      mother_name,

      // Address fields
      house_name,
      street,
      city,
      landmark,
      district,
      state,
      country,
      post,
      pincode,
      update_roll_number,
    } = req.body;

    if (reg_no) {
      const existingRegNo = await Student.findOne({
        where: { reg_no, school_id, id: { [Op.ne]: id } },
      });
      if (existingRegNo) {
        return res
          .status(400)
          .json({ error: "Reg number already exists in student table" });
      }
    }

    const student = await Student.findByPk(id);
    if (!student || student.trash)
      return res.status(404).json({ error: "Student not found" });

    const guardianUser = await User.findByPk(student.guardian_id);

    const targetClassId = class_id !== undefined ? class_id : student.class_id;
    const shouldReorderRollNumbers =
      update_roll_number === true || update_roll_number === "true";

    if (roll_number !== undefined) {
      const normalizedRollNumber = Number(roll_number);
      if (!Number.isInteger(normalizedRollNumber) || normalizedRollNumber < 1) {
        return res.status(400).json({ error: "Roll number must be a positive integer" });
      }

      const existingRollNumber = await Student.findOne({
        where: {
          roll_number: normalizedRollNumber,
          school_id,
          class_id: targetClassId,
          trash: false,
          id: { [Op.ne]: id },
        },
      });

      if (existingRollNumber && !shouldReorderRollNumbers) {
        return res.status(400).json({
          error: "Roll number already exists in student table for this class",
        });
      }

      if (existingRollNumber && shouldReorderRollNumbers) {
        const currentRollNumber = Number(student.roll_number);

        if (normalizedRollNumber > currentRollNumber) {
          const studentsToShift = await Student.findAll({
            where: {
              school_id,
              class_id: targetClassId,
              trash: false,
              roll_number: {
                [Op.between]: [currentRollNumber + 1, normalizedRollNumber],
              },
              id: { [Op.ne]: id },
            },
          });

          await Promise.all(
            studentsToShift.map((studentRecord) =>
              studentRecord.update({
                roll_number: Number(studentRecord.roll_number) - 1,
              }),
            ),
          );
        } else if (normalizedRollNumber < currentRollNumber) {
          const studentsToShift = await Student.findAll({
            where: {
              school_id,
              class_id: targetClassId,
              trash: false,
              roll_number: {
                [Op.between]: [normalizedRollNumber, currentRollNumber - 1],
              },
              id: { [Op.ne]: id },
            },
          });

          await Promise.all(
            studentsToShift.map((studentRecord) =>
              studentRecord.update({
                roll_number: Number(studentRecord.roll_number) + 1,
              }),
            ),
          );
        }
      }
    }
    // Handle student image — support both legacy req.file and new req.uploadedFiles
    let studentImageFilename = student.image;
    const newStudentImageUrl = req.uploadedFiles?.image?.[0]?.url || null;
    if (newStudentImageUrl) {
      if (studentImageFilename) {
        await deleteFile(studentImageFilename);
      }
      studentImageFilename = newStudentImageUrl;
    }
    let guardianDpFilename = guardianUser.dp;
    const newGuardianDpUrl = req.uploadedFiles?.dp?.[0]?.url || null;
    if (newGuardianDpUrl) {
      if (guardianDpFilename) {
        await deleteFile(guardianDpFilename);
      }
      guardianDpFilename = newGuardianDpUrl;
    }

    await student.update({
      school_id,
      reg_no,
      roll_number,
      full_name,
      date_of_birth,
      gender: normalizeGender(gender),
      class_id,
      address,
      admission_date,
      status,
      second_language,
      image: studentImageFilename,
      alumni,
    });

    if (student.guardian_id) {
      const guardian = await Guardian.findOne({
        where: { user_id: student.guardian_id },
      });

      if (guardian) {
        if (
          guardian_contact &&
          guardian_contact !== guardian.guardian_contact
        ) {
          const existingPhone = await User.findOne({
            where: {
              phone: guardian_contact,
              id: { [Op.ne]: student.guardian_id },
            },
          });
          if (existingPhone) {
            return res.status(400).json({
              error: "Guardian phone already exists in user table",
            });
          }
        }

        // Validate uniqueness of email if being changed
        if (guardian_email && guardian_email !== guardian.guardian_email) {
          const existingEmail = await User.findOne({
            where: {
              email: guardian_email,
              id: { [Op.ne]: student.guardian_id },
            },
          });
          if (existingEmail && guardian_email !== "") {
            return res.status(400).json({
              error: "Guardian email already exists in user table",
            });
          }
        }

        await guardian.update({
          guardian_name: guardian_name || guardian.guardian_name,
          guardian_contact: guardian_contact || guardian.guardian_contact,
          guardian_email:
            guardian_email !== undefined
              ? guardian_email
              : guardian.guardian_email,
          guardian_relation: guardian_relation
            ? normalizeGuardianRelation(guardian_relation)
            : guardian.guardian_relation,
          guardian_job:
            guardian_job !== undefined ? guardian_job : guardian.guardian_job,
          guardian2_name:
            guardian2_name !== undefined
              ? guardian2_name
              : guardian.guardian2_name,
          guardian2_relation: guardian2_relation
            ? normalizeGuardianRelation(guardian2_relation)
            : guardian.guardian2_relation,
          guardian2_contact:
            guardian2_contact !== undefined
              ? guardian2_contact
              : guardian.guardian2_contact,
          guardian2_job:
            guardian2_job !== undefined
              ? guardian2_job
              : guardian.guardian2_job,
          father_name:
            father_name !== undefined ? father_name : guardian.father_name,
          mother_name:
            mother_name !== undefined ? mother_name : guardian.mother_name,
          house_name:
            house_name !== undefined ? house_name : guardian.house_name,
          street: street !== undefined ? street : guardian.street,
          city: city !== undefined ? city : guardian.city,
          landmark: landmark !== undefined ? landmark : guardian.landmark,
          district: district !== undefined ? district : guardian.district,
          state: state !== undefined ? state : guardian.state,
          country: country !== undefined ? country : guardian.country,
          post: post !== undefined ? post : guardian.post,
          pincode: pincode !== undefined ? pincode : guardian.pincode,
          dp: guardianDpFilename,
        });

        // Sync guardian User record
        if (guardianUser) {
          const newGuardianDpUrl = req.uploadedFiles?.dp?.[0]?.url || null;
          let guardianDp = guardianUser.dp;
          if (newGuardianDpUrl) {
            guardianDp = newGuardianDpUrl;
          }
          await guardianUser.update({
            name: guardian_name || guardianUser.name,
            email:
              guardian_email !== undefined
                ? guardian_email
                : guardianUser.email,
            phone: guardian_contact || guardianUser.phone,
            dp: guardianDp,
          });
        }
      }
    }

    const updated = await Student.findByPk(id);
    res.status(200).json({ message: "Student updated successfully", updated });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating student:",
      error,
    );
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
};
const deleteStudent = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { id } = req.params;
    const student = await Student.findOne({
      where: { id, school_id, trash: false },
    });

    if (!student || student.trash) {
      return res.status(404).json({ error: "Student not found" });
    }

    const deletedRollNumber = Number(student.roll_number);
    const targetClassId = student.class_id;

    await student.update({ trash: true });

    const studentsToReorder = await Student.findAll({
      where: {
        school_id,
        class_id: targetClassId,
        trash: false,
        roll_number: { [Op.gt]: deletedRollNumber },
      },
      order: [["roll_number", "ASC"]],
    });

    await Promise.all(
      studentsToReorder.map((studentRecord) =>
        studentRecord.update({
          roll_number: Number(studentRecord.roll_number) - 1,
        }),
      ),
    );

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting student:",
      error,
    );
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
};
const restoreStudent = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student || !student.trash) {
      return res
        .status(404)
        .json({ error: "Student not found or not in trash" });
    }

    const restoredRollNumber = Number(student.roll_number);
    const targetClassId = student.class_id;

    await student.update({ trash: false });

    const studentsToReorder = await Student.findAll({
      where: {
        school_id,
        class_id: targetClassId,
        trash: false,
        roll_number: { [Op.gte]: restoredRollNumber },
        id: { [Op.ne]: id },
      },
      order: [["roll_number", "ASC"]],
    });

    await Promise.all(
      studentsToReorder.map((studentRecord) =>
        studentRecord.update({
          roll_number: Number(studentRecord.roll_number) + 1,
        }),
      ),
    );

    res.status(200).json({ message: "Student restored successfully" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error restoring student:",
      error,
    );
    console.error("Error restoring student:", error);
    res.status(500).json({ error: "Failed to restore student" });
  }
};

const permanentDeleteStudent = async (req, res) => {
  const transaction = await schoolSequelize.transaction();
  try {
    const school_id = req.user.school_id;
    const role = req.user.role;
    const user_id = req.user.user_id;
    const strictDelete = req.user.strict_delete;
    const { id } = req.params;
    if (role !== "admin") {
      await transaction.rollback();
      return res
        .status(403)
        .json({ error: "You are not authorized to perform this action" });
    }

    const student = await Student.findOne({
      where: { id, school_id, trash: true },
      transaction,
    });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ error: "Student not found in trash" });
    }

    const guardianUserId = student.guardian_id;

    const payments = await Payment.findOne({
      where: { student_id: id },
      transaction,
    });
    if(payments && strictDelete !=="true"){
      await transaction.rollback();
      return res.status(400).json({ error: "Unable to delete this user because other records are linked to this account." });
    }
    if(payments){
    for (const payment of payments) {
      if (payment.payment_attachment) {
        await deleteFile(payment.payment_attachment);
      }
    }
    await Payment.update(
      { 
        student_id: null,
        invoice_student_id: null,
       },
      { where: { student_id: id }, transaction },
    );
  }
    await InvoiceStudent.destroy({
      where: { student_id: id },
      transaction,
    });

    await Marks.destroy({
      where: { student_id: id },
      transaction,
    });

    const homeworkAssignments = await HomeworkAssignment.findAll({
      where: { student_id: id },
      transaction,
    });
    for (const assignment of homeworkAssignments) {
      if (assignment.solved_file) {
        await deleteFile(assignment.solved_file);
      }
    }
    await HomeworkAssignment.destroy({
      where: { student_id: id },
      transaction,
    });

    await AttendanceMarked.destroy({
      where: { student_id: id },
      transaction,
    });
    await StudentAchievement.destroy({
      where: { student_id: id },
      transaction,
    });
   await StudentsStopStatus.destroy({
      where: { student_id: id },
      transaction,
   })
    const leaveRequests = await LeaveRequest.findAll({
      where: { student_id: id },
      transaction,
    });
    for (const leave of leaveRequests) {
      if (leave.attachment) {
        await deleteFile(leave.attachment);
      }
    }
    await LeaveRequest.destroy({
      where: { student_id: id },
      transaction,
    });

    await Message.destroy({
      where: { student_id: id },
      transaction,
    });
    await StudentTransfer.destroy({
      where: { student_id: id },
      transaction,
    });
    await SpecialClassStudent.destroy({
      where: { student_id: id },
      transaction,
    });

    if (student.image) {
      await deleteFile(student.image);
    }
    await student.destroy({ transaction });

    const remainingStudents = await Student.count({
      where: {
        guardian_id: guardianUserId,
        id: { [Op.ne]: id },
      },
      transaction,
    });

    if (remainingStudents === 0) {
      await Guardian.destroy({
        where: { user_id: guardianUserId },
        transaction,
      });
      // await User.destroy({
      //   where: { id: guardianUserId },
      //   transaction,
      // });
    }

    await transaction.commit();
    res.status(200).json({ message: "Student permanently deleted" });
  } catch (error) {
    await transaction.rollback();
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error permanently deleting student:",
      error,
    );
    console.error("Error permanently deleting student:", error);
    res.status(500).json({ error: "Failed to permanently delete student" });
  }
};
const getTrashedStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: true,
      school_id,
      alumni: false,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
        { full_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: students } = await Student.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        { model: User, attributes: ["name", "email", "phone", "dp"] },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res
      .status(200)
      .json({ totalcontent: count, totalPages, currentPage: page, students });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching trashed students:",
      error,
    );
    console.error("Error fetching trashed students:", error);
    res.status(500).json({ error: "Failed to fetch trashed students" });
  }
};

const bulkUpdateStudentsToAlumni = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: "No student IDs provided" });
    }

    const transaction = await schoolSequelize.transaction();
    try {
      const result = await Student.update(
        { alumni: true },
        { where: { id: studentIds }, transaction },
      );

      await transaction.commit();
      res
        .status(200)
        .json({ message: `${result[0]} students updated to alumni` });
    } catch (error) {
      await transaction.rollback();
      logger.error(
        "schoolId:",
        req.user.school_id,
        "Error updating students to alumni:",
        error,
      );
      console.error("Error updating students to alumni:", error);
      res.status(500).json({ error: "Failed to update students to alumni" });
    }
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error in bulkUpdateStudentsToAlumni:",
      error,
    );
    console.error("Error in bulkUpdateStudentsToAlumni:", error);
    res.status(500).json({ error: "Failed to update students to alumni" });
  }
};

const bulkUpdateStudentsClass = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { student_ids, class_id, roll_numbers } = req.body;

    if (!class_id) {
      return res.status(400).json({ error: "class_id is required" });
    }
    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: "No student IDs provided" });
    }

    // If roll_numbers provided, must be an array of same length as student_ids
    if (roll_numbers && (!Array.isArray(roll_numbers) || roll_numbers.length !== student_ids.length)) {
      return res.status(400).json({ error: "roll_numbers must be an array with same length as student_ids" });
    }

    const existingClass = await Class.findOne({
      where: { id: class_id, school_id, trash: false, special: false },
    });
    if (!existingClass) {
      return res.status(404).json({ error: "Class not found" });
    }    
    if (roll_numbers) {
      for (let i = 0; i < roll_numbers.length; i++) {
        const roll = parseInt(roll_numbers[i], 10);
        if (Number.isNaN(roll)) continue;
        const existing = await Student.findOne({
          where: { class_id, roll_number: roll, school_id, trash: false },
        });
       if(existing) {
        return res.status(409).json({
          error: `Roll number ${roll} already exists in class ${class_id}`,
        });
      }
     }
    }
      const [updatedCount] = await Student.update(
        { class_id },
        {
          where: { id: student_ids, school_id, trash: false },
        },
      );
    
      res.status(200).json({ message: `${updatedCount} students updated` });
    } catch (error) {
      await transaction.rollback();
      logger.error(
        "schoolId:",
        req.user.school_id,
        "Error updating students class:",
        error,
      );
      console.error("Error updating students class:", error);
      res.status(500).json({ error: "Failed to update students class" });
    }
  };
const getAlumniStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const classId = req.query.class_id;

    const whereClause = {
      trash: false,
      school_id,
      alumni: true,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
        { full_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (classId) {
      whereClause.class_id = classId;
    }

    const { count, rows: students } = await Student.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,

      include: [
        { model: User, attributes: ["name", "email", "phone", "dp"] },
        {
          model: Class,
          attributes: ["id", "year", "division", "classname"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    res
      .status(200)
      .json({ totalcontent: count, totalPages, currentPage: page, students });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching students:",
      error,
    );
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};
const getTrashedAlumniStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: true,
      school_id,
      alumni: true,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
        { full_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: students } = await Student.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        { model: User, attributes: ["name", "email", "phone", "dp"] },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
      ],
      order: [["updatedAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res
      .status(200)
      .json({ totalcontent: count, totalPages, currentPage: page, students });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching trashed students:",
      error,
    );
    console.error("Error fetching trashed students:", error);
    res.status(500).json({ error: "Failed to fetch trashed students" });
  }
};

const createDutyWithAssignments = async (req, res) => {
  const transaction = await schoolSequelize.transaction();
  let uploadDir = null;

  try {
    const school_id = req.user.school_id;
    const { title, description, deadline, assignments, start_date } = req.body;

    if (!school_id || !title || !description || !deadline || !assignments) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const duplicate = await Duty.findOne({
      where: { title, school_id, deadline },
    });
    if (duplicate) {
      return res.status(400).json({ error: "Duty already exists" });
    }
    const fileUrl = req.uploadedFiles?.file?.url || null;

    const duty = await Duty.create(
      {
        school_id,
        title,
        description,
        start_date: start_date || new Date(),
        deadline,
        file: fileUrl,
        recorded_by: req.user.user_id,
      },
      { transaction },
    );

    const parsedAssignments =
      typeof assignments === "string" ? JSON.parse(assignments) : assignments;

    if (!Array.isArray(parsedAssignments) || parsedAssignments.length === 0) {
      throw new Error("Assignments must be a non‑empty array");
    }

    const bulkAssignments = parsedAssignments.map((a) => ({
      staff_id: a.staff_id,
      duty_id: duty.id,
      remarks: a.remarks || null,
      status: a.status || "pending",
    }));

    const createdAssignments = await DutyAssignment.bulkCreate(
      bulkAssignments,
      {
        validate: true,
        transaction,
      },
    );

    await transaction.commit();

    res.status(201).json({
      message: "Duty and assignments created",
      duty,
      assignments: createdAssignments,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "createDutyWithAssignments →",
      error,
    );
    if (uploadDir) await deleteFiles(uploadDir);
    await transaction.rollback();
    console.error("createDutyWithAssignments →", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllTeacherDuties = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const deadline = req.query.deadline || "";
    const download = req.query.download || "";
    let { page = 1, limit = 10 } = req.query;
    if (download === "true") {
      page = null;
      limit = null;
    } else {
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
    }

    const offset = page && limit ? (page - 1) * limit : 0;
    const whereClause = {
      trash: false,
      school_id,
    };

    if (deadline) {
      whereClause.deadline = deadline;
    }
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const totalCount = await Duty.count({ where: whereClause });
    const duties = await Duty.findAll({
      offset,
      distinct: true,
      where: whereClause,
      include: [
        {
          model: DutyAssignment,
          attributes: ["id", "remarks", "status", "solved_file"],
          required: true,
          include: [
            {
              model: User,
              attributes: ["id", "name", "dp", "role"],
              required: true,
              where: { role: "teacher" },
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const formattedData = duties.map((record) => {
      const total_staff = record.DutyAssignments?.length || 0;
      const pending_count =
        record.AttendanceMarkeds?.filter((m) => m.status === "pending")
          .length || 0;
      const in_progress_count =
        record.AttendanceMarkeds?.filter((m) => m.status === "in_progress")
          .length || 0;
      const completed_count =
        record.AttendanceMarkeds?.filter((m) => m.status === "completed")
          .length || 0;
      return {
        ...record.toJSON(),
        total_staff,
        pending_count,
        in_progress_count,
        completed_count,
      };
    });

    const totalPages = Math.ceil(duties.length / limit);
    res.status(200).json({
      totalcontent: duties.length,
      totalPages: download === "true" ? null : totalPages,
      currentPage: download === "true" ? null : page,
      duties: formattedData,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getAllDuties →", error);
    res.status(500).json({ error: "Failed to fetch duties" });
  }
};
const getAllStaffDuties = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const deadline = req.query.deadline || "";
    const download = req.query.download || "";
    let { page = 1, limit = 10 } = req.query;
    if (download === "true") {
      page = null;
      limit = null;
    } else {
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
    }

    const offset = page && limit ? (page - 1) * limit : 0;
    const whereClause = {
      trash: false,
      school_id,
    };

    if (deadline) {
      whereClause.deadline = deadline;
    }
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const totalCount = await Duty.count({ where: whereClause });
    const duties = await Duty.findAll({
      offset,
      distinct: true,
      where: whereClause,
      include: [
        {
          model: DutyAssignment,
          attributes: ["id", "remarks", "status", "solved_file"],
          required: true,
          include: [
            {
              model: User,
              attributes: ["id", "name", "dp", "role"],
              required: true,
              where: { role: "staff" },
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const formattedData = duties.map((record) => {
      const total_staff = record.DutyAssignments?.length || 0;
      const pending_count =
        record.AttendanceMarkeds?.filter((m) => m.status === "pending")
          .length || 0;
      const in_progress_count =
        record.AttendanceMarkeds?.filter((m) => m.status === "in_progress")
          .length || 0;
      const completed_count =
        record.AttendanceMarkeds?.filter((m) => m.status === "completed")
          .length || 0;
      return {
        ...record.toJSON(),
        total_staff,
        pending_count,
        in_progress_count,
        completed_count,
      };
    });

    const totalPages = Math.ceil(duties.length / limit);
    res.status(200).json({
      totalcontent: duties.length,
      totalPages: download === "true" ? null : totalPages,
      currentPage: download === "true" ? null : page,
      duties: formattedData,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getAllDuties →", error);
    res.status(500).json({ error: "Failed to fetch duties" });
  }
};
const getDutyById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { id } = req.params;
    const duty = await Duty.findOne({
      where: { id, school_id },
      include: [
        {
          model: DutyAssignment,
          attributes: ["id", "remarks", "status", "solved_file"],
          include: [
            {
              model: User,
              attributes: ["id", "name", "dp"],
            },
          ],
        },
        { model: User, attributes: ["id", "name"] },
      ],
    });

    if (!duty) {
      return res.status(404).json({ error: "Duty not found" });
    }

    res.json(duty);
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getDutyById →", error);
    res.status(500).json({ error: "Failed to fetch duty" });
  }
};
const updateDuty = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { title, description, deadline, start_date } = req.body;
    const duty = await Duty.findOne({
      where: { id: req.params.id, school_id },
    });
    if (!duty) return res.status(404).json({ error: "Duty not found" });

    const existingDuty = await Duty.findOne({
      where: { school_id: duty.school_id, title, deadline },
    });
    if (existingDuty && existingDuty.id !== duty.id) {
      return res
        .status(409)
        .json({ error: "Duty with the same title already exists" });
    }
    let finalFile = duty.file;
    const newFileUrl = req.uploadedFiles?.file?.url || null;

    if (newFileUrl) {
      if (duty.file) {
        await deleteFile(duty.file);
      }
      finalFile = newFileUrl;
    }
    await duty.update({
      title,
      description,
      deadline,
      start_date,
      file: finalFile,
    });
    res.json(duty);
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "updateDuty →", error);
    res.status(500).json({ error: "Failed to update duty" });
  }
};
const updateDutyAssigned = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const { remarks, status } = req.body;

    const assignedDuty = await DutyAssignment.findByPk(id);
    if (!assignedDuty) {
      return res.status(404).json({ error: "Not found" });
    }
    const duty = await Duty.findOne({
      where: { id: assignedDuty.duty_id, school_id },
    });
    if (!duty) return res.status(404).json({ error: "Duty not found" });

    let fileName = assignedDuty.solved_file;
    const newFileUrl = req.uploadedFiles?.file?.url || null;
    if (newFileUrl) {
      if (assignedDuty.solved_file) {
        await deleteFile(assignedDuty.solved_file);
      }
      fileName = newFileUrl;
    }
    const updatedDuty = await assignedDuty.update({
      status,
      remarks,
      solved_file: fileName ? fileName : null,
    });
    res.json({ message: "Updated", updatedDuty });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "updateDutyAssigned →", error);
    res.status(500).json({ error: error.message });
  }
};
const bulkUpdateDutyAssignments = async (req, res) => {
  const transaction = await schoolSequelize.transaction();
  try {
    const school_id = req.user.school_id;
    const { duty_id, updates } = req.body;

    if (!duty_id || !Array.isArray(updates)) {
      return res
        .status(400)
        .json({ error: "duty_id and updates array are required" });
    }
    const duty = await Duty.findOne({
      where: { id: duty_id, school_id, trash: false },
    });
    if (!duty) return res.status(404).json({ error: "Duty not found" });

    const newStaffIds = updates.map((u) => u.staff_id);

    const existingAssignments = await DutyAssignment.findAll({
      where: { duty_id },
      transaction,
    });
    const existingStaffIds = existingAssignments.map((a) => a.staff_id);

    const staffIdsToDelete = existingStaffIds.filter(
      (id) => !newStaffIds.includes(id),
    );
    if (staffIdsToDelete.length > 0) {
      await DutyAssignment.destroy({
        where: {
          duty_id,
          staff_id: staffIdsToDelete,
        },
        transaction,
      });
    }

    for (const item of updates) {
      if (existingStaffIds.includes(item.staff_id)) {
        await DutyAssignment.update(
          {
            status: item.status,
            remarks: item.remarks,
          },
          {
            where: {
              duty_id,
              staff_id: item.staff_id,
            },
            transaction,
          },
        );
      } else {
        await DutyAssignment.create(
          {
            duty_id,
            staff_id: item.staff_id,

            status: item.status || "pending",
            remarks: item.remarks || null,
          },
          { transaction },
        );
      }
    }

    await transaction.commit();
    res.status(200).json({ message: "Duty assignments synced successfully" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "bulkUpdateDutyAssignments →",
      error,
    );
    await transaction.rollback();
    console.error("Bulk update failed:", error);
    res.status(500).json({ error: "Bulk update failed" });
  }
};

const deleteDuty = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const duty = await Duty.findOne({
      where: { id, school_id, trash: false },
    });
    if (!duty || duty.trash)
      return res.status(404).json({ error: "Not found" });

    await Duty.update({ trash: true }, { where: { id: id } });
    res.status(200).json({
      message: `Deleted successfully.`,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "deleteDuty →", error);
    res.status(500).json({ error: "Delete failed duty" });
  }
};
const getTrashedDuties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school_id = req.user.school_id;
    const { count, rows: duties } = await Duty.findAndCountAll({
      offset,
      limit,
      distinct: true,
      where: { school_id, trash: true },
      order: [["updatedAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      duties,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getTrashedDuties →", error);
    res.status(500).json({ error: error.message });
  }
};

const restoreDuty = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const duty = await Duty.findOne({
      where: { id, school_id, trash: true },
    });
    if (!duty) return res.status(404).json({ error: "Not found" });

    await Duty.update({ trash: false }, { where: { id: id } });

    res.json({
      message: `restored successfully duty.`,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "restoreDuty →", error);
    res.status(500).json({ error: error.message });
  }
};
const permanentDeleteDuty = async (req, res) => {
  const transaction = await schoolSequelize.transaction();
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    //delete duty files
    const duty = await Duty.findOne({
      where: { id, school_id, trash: true },
    })
    if (!duty) return res.status(404).json({ error: "Not found" });
 
    const dutyAssignments = await DutyAssignment.findAll({
      where: { duty_id: id },
    });
    if (dutyAssignments.length > 0) {
      for (const assignment of dutyAssignments) {
        if (assignment.file) {
          await deleteFile(assignment.file);
        }
      }
      await DutyAssignment.destroy({ where: { duty_id: id } }, { transaction });
    }
    if(duty.file){
      await deleteFile(duty.file);
    }
    await Duty.destroy(
      { where: { id} },
      { transaction },
    );
    await transaction.commit();
    res.json({ message: "Peremently Deleted Duty" });
  } catch (error) {
    await transaction.rollback();
    logger.error("schoolId:", req.user.school_id, "permanentDeleteDuty →", error);
    res.status(500).json({ error: error.message });
  }
};
//manage Achievements
const uploadAchievementPath = "uploads/achievement_proofs/";

const createAchievementWithStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;
    const {
      title,
      description,
      category,
      level,
      date,
      awarding_body,
      students,
    } = req.body;

    if (
      students === undefined ||
      students.length === 0 ||
      students[0].student_id === undefined
    ) {
      return res
        .status(400)
        .json({ error: "At least one student id is required" });
    }

    let parsedStudents;
    if (typeof students === "string") {
      parsedStudents = JSON.parse(students);
    } else {
      parsedStudents = students;
    }
    const existingAchievement = await Achievement.findOne({
      where: {
        school_id,
        title,
        date,
        recorded_by,
      },
    });

    if (existingAchievement) {
      return res
        .status(400)
        .json({ error: "An achievement with the same title already exists" });
    }
    const achievement = await Achievement.create({
      school_id,
      title,
      description,
      category,
      level,
      date,
      awarding_body,
      recorded_by,
    });

    const studentAchievements = await Promise.all(
      parsedStudents.map(async (student, index) => {


        return {
          achievement_id: achievement.id,
          student_id: student.student_id,
          status: student.status,
          remarks: student.remarks,
        };
      }),
    );

    await StudentAchievement.bulkCreate(studentAchievements);

    res.status(201).json({
      message: "Achievement with students saved successfully",
      achievement,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "createAchievementWithStudents →",
      error,
    );
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
const getAllAchievements = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const class_id = req.query.class_id || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {
      trash: false,
      school_id: school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } }, // Corrected syntax
        { description: { [Op.like]: `%${searchQuery}%` } }, // Corrected syntax
      ];
    }

    const { count, rows: achievements } = await Achievement.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      attributes: ["id", "title", "description", "category", "level", "date","createdAt"],
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image", "class_id"],
          where: class_id ? { class_id } : undefined,
          required: true,
          through: {
            model: StudentAchievement,
            attributes: ["status", "proof_document", "remarks"],
          },
          include: [
            {
              model: Class,
              attributes: ["id", "classname", "year", "division"],
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
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "error in getAllAchievements →", error);
    console.error("Error fetching achievements:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAchievementById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const achievement = await Achievement.findOne({
      where: { id: req.params.id, school_id, trash: false },
      attributes: ["id", "title", "description", "category", "level", "date","awarding_body"],
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
        { model: User, attributes: ["id", "name"] },
      ],
    });
    res.status(200).json(achievement);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "getAchievementById →",
      error,
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateAchievement = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const userId = req.user.user_id;
    const achievement = await Achievement.findOne({
      where: { id: req.params.id, school_id },
      attributes: ["id", "title", "description", "category", "level", "date"],
    });
    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }
    const {
      title,
      description,
      category,
      level,
      date,
      awarding_body,
    } = req.body;

    await achievement.update({
      title,
      description,
      category,
      level,
      date,
      awarding_body,
      recorded_by:userId,
    });
    res
      .status(200)
      .json({ message: "Achievement updated successfully", achievement });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "updateAchievement →", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAchievement = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const achievement = await Achievement.findOne({
      where: { id: req.params.id, school_id, trash: false },
    });
    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }
    await Achievement.update(
      { trash: true },
      { where: { id: req.params.id, school_id } },
    );
    res.status(200).json({ message: "Achievement trashed successfully" });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "deleteAchievement →", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const getTrashedAchievements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school_id = req.user.school_id;
    const { count, rows: achievements } = await Achievement.findAndCountAll({
      offset,
      limit,
      where: { school_id, trash: true },
      attributes: ["id", "title", "description", "category", "level", "date"],
      order: [["updatedAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      achievements,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "getTrashedAchievements →",
      error,
    );
    res.status(500).json({ error: "Internal server error" });
  }
};
const restoreAchievement = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const achievement = await Achievement.findOne({
      where: { id: req.params.id, school_id, trash: true },
    });
    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }
    await Achievement.update(
      { trash: false },
      { where: { id: req.params.id, school_id } },
    );
    res.status(200).json({ message: "Achievement restored successfully" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "restoreAchievement :",
      error,
    );
    res.status(500).json({ error: "Internal server error" });
  }
};
const updateStudentAchievement = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { students, status, remarks } = req.body;
    const validStatuses = [
      "1st prize",
      "2nd prize",
      "3rd prize",
      "participant",
      "other",
    ];

    if (students !== undefined) {
      let parsedStudents;
      if (typeof students === "string") {
        parsedStudents = JSON.parse(students);
      } else {
        parsedStudents = students;
      }

      if (!Array.isArray(parsedStudents) || parsedStudents.length === 0) {
        return res.status(400).json({ error: "At least one student is required" });
      }

      const achievement = await Achievement.findOne({
        where: { id: req.params.id, school_id, trash: false },
      });

      if (!achievement) {
        return res.status(404).json({ error: "Achievement not found" });
      }

      // const uploadedFiles = req.files && Array.isArray(req.files)
      //   ? req.files
      //   : req.file
      //     ? [req.file]
      //     : [];

      const updatedStudents = await Promise.all(
        parsedStudents.map(async (student, index) => {
          const studentStatus = student.status || status;
          if (studentStatus && !validStatuses.includes(studentStatus)) {
            throw new Error("Invalid status");
          }

          const existingStudentAchievement = await StudentAchievement.findOne({
            where: {
              achievement_id: achievement.id,
              student_id: student.student_id,
            },
          });

          const payload = {
            status: studentStatus || existingStudentAchievement?.status || "participant",
            remarks: student.remarks ?? remarks ?? existingStudentAchievement?.remarks ?? null,
          };

          if (existingStudentAchievement) {
            await existingStudentAchievement.update(payload);
            return existingStudentAchievement;
          }

          return StudentAchievement.create({
            achievement_id: achievement.id,
            student_id: student.student_id,
            ...payload,
          });
        }),
      );

      return res.status(200).json({
        message: "Student achievements updated successfully",
        updatedStudents,
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const StudentAchievementData = await StudentAchievement.findOne({
      where: { id: req.params.id },
      attributes: ["id", "status", "proof_document", "remarks"],
      include: [
        {
          model: Achievement,
          attributes: ["id", "title", "student_id"],
          where: { school_id },
        },
      ],
    });
    if (!StudentAchievementData) {
      return res.status(404).json({ error: "Student achievement not found" });
    }

    await StudentAchievementData.update({
      status: status || StudentAchievementData.status,
      remarks: remarks ?? StudentAchievementData.remarks,
    });
    res.status(200).json({
      message: "Student achievement updated successfully",
      StudentAchievementData,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "updateStudentAchievement :",
      error,
    );
    res.status(500).json({ error: "Internal server error" });
  }
};
const peremententDeleteAchievement = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { id } = req.params;
    const achievement = await Achievement.findOne({
      where: { id, school_id, trash: true },
    });
    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }

    const studentAchievements = await StudentAchievement.findAll({
      where: { achievement_id: id },
    });
    await StudentAchievement.destroy({ where: { achievement_id: id } });
    await Achievement.destroy({ where: { id } });
    res.status(200).json({ message: "Achievement deleted successfully" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "peremententDeleteAchievement :",
      error,
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

const createEvent = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { title, description, date, url, venue } = req.body;
    if (!school_id || !title || !date) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingEvent = await Event.findOne({
      where: { school_id, title, date },
    });
    if (existingEvent) {
      return res
        .status(400)
        .json({ error: "Event with the same title already exists" });
    }
    const eventFileUrl = req.uploadedFiles?.file?.url || null;

    const event = await Event.create({
      school_id,
      title,
      description,
      date,
      user_id: req.user.user_id,
      url,
      venue,
      file: eventFileUrl ? eventFileUrl : null,
      recorded_by: req.user.user_id,
    });

    res.status(201).json(event);
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "createEvent :", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
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
    if (date) {
      whereClause.date = date;
    }
    const { count, rows: events } = await Event.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      order: [["createdAt", "DESC"]], 
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      events,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getAllEvents :", error);
    res.status(500).json({ error: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const event = await Event.findOne({
      where: { id: req.params.id, school_id },
      include: [
    { model: User, attributes: ["id", "name"] },
      ]
    });
    if (!event || event.trash)
      return res.status(404).json({ error: "Event not found" });
    res.status(200).json(event);
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getEventById :", error);
    res.status(500).json({ error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { title, description, date, url, venue } = req.body;
    const Id = req.params.id;
    const existingEvent = await Event.findOne({
      where: { school_id, title, date, id: { [Op.ne]: Id } },
    });

    if (existingEvent) {
      return res
        .status(409)
        .json({ error: "Event with the same title already exists" });
    }

    const event = await Event.findOne({ where: { id: Id, school_id } });
    if (!event || event.trash)
      return res.status(404).json({ error: "Event not found" });

    const newFileUrl = req.uploadedFiles?.file?.url || null;

    let finalFile = event.file || null;
    if (newFileUrl) {
      if (event.file) {
        await deleteFile(event.file);
      }
      finalFile = newFileUrl;
    }
    await event.update({
      school_id,
      title,
      description,
      date,
      url,
      venue,
      file: finalFile,
    });
    res.status(200).json({ message: "Event updated successfully", event });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "updateEvent :", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    await Event.update(
      { trash: true },
      { where: { id: req.params.id, school_id } },
    );
    res.status(200).json({ message: "Event soft deleted" });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "deleteEvent :", error);
    res.status(500).json({ error: error.message });
  }
};
const getTrashedEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school_id = req.user.school_id;
    const { count, rows: events } = await Event.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { trash: true, school_id },
      order: [["updatedAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      events,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getTrashedEvents :", error);
    res.status(500).json({ error: error.message });
  }
};
const restoreEvent = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const event = await Event.findOne({
      where: { id: req.params.id, school_id, trash: true },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    await Event.update(
      { trash: false },
      { where: { id: req.params.id, school_id } },
    );
    res.status(200).json({ message: "Event restored successfully" });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "restoreEvent :", error);
    res.status(500).json({ error: error.message });
  }
};
const permanentDeleteEvent = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const event = await Event.findOne({
      where: { id: req.params.id, school_id },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    const uploadPath = "uploads/event_files/";
    if (event.file) {
      await deleteFile(event.file);
    }
    await event.destroy();

    res.status(200).json({ message: "Event permanently deleted" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "permanentDeleteEvent :",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const createPayment = async (req, res) => {
  try {
    const school_id = req.user.school_id; 
    const userId=req.user.user_id;
    const {
      student_id,
      invoice_student_id,
      amount,
      payment_date,
      payment_category,
      transaction_id,
      payment_method,
      payment_status,
    } = req.body;

    if (
      !school_id ||
      !amount ||
      !payment_date ||
      !payment_category ||
      !payment_method
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }
    //check if transaction_id already unique or null is
    const existingTransaction_id = await Payment.findOne({
      where: { transaction_id },
    });
    if (
      existingTransaction_id &&
      existingTransaction_id.transaction_id !== ""
    ) {
      return res.status(400).json({ error: "Transaction ID already exists" });
    }
    const existingPayment = await Payment.findOne({
      where: {
        invoice_student_id,
        school_id,
        student_id,
        payment_date,
        payment_category,
      },
    });
    if (existingPayment) {
      return res
        .status(400)
        .json({ error: "Payment with the same details already exists" });
    }
    let transcation_status=payment_status;
   if(payment_category === "donation" && !payment_status ){
      transcation_status = "completed";
    }
    const payment = await Payment.create({
      school_id,
      student_id,
      invoice_student_id,
      amount,
      payment_date,
      payment_category,
      transaction_id,
      payment_method,
      payment_status:transcation_status,
      recorded_by: userId,
      updated_by: userId,
    });
    let invoice_status = "";

 
    if (payment_status === "completed" && invoice_student_id) {
      const invoiceStudent = await InvoiceStudent.findOne({
        where: { id: invoice_student_id },
        include: [{ model: Invoice, attributes: ["id", "amount"] }],
      });
      //the same invoice_student_id used payemnt amount also get and check
      let totalPaid = 0;
      if (invoice_student_id) {
        totalPaid = await Payment.sum("amount", {
          where: {
            invoice_student_id: invoice_student_id,
            payment_status: "completed",
          },
        });
      }
      const invoiceAmount = invoiceStudent?.Invoice?.amount || 0;

      if (invoiceStudent && totalPaid >= invoiceAmount) {
        await invoiceStudent.update({ status: "paid" });
        invoice_status = "paid";
      } else {
        await invoiceStudent.update({ status: "partially_paid" });
        invoice_status = "partially_paid";
      }
    }
    res.status(201).json({
      message: "Payment created",
      payment,
      "invoice status": invoice_status,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "createPayment :", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const payment_category = req.query.payment_category || "";
    const payment_method = req.query.payment_method || "";
    const payment_status = req.query.payment_status || "";
    const class_id = req.query.class_id || null;
    const year = req.query.year || null;
    const student_id = req.query.student_id || null;
    const start_date = req.query.start_date || null;
    const end_date = req.query.end_date || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    if (
      payment_category &&
      ![
        "tuition",
        "admission",
        "exam",
        "transport",
        "hostel",
        "lab",
        "library",
        "activity",
        "fine",
        "event",
        "excursion",
        "other",
      ].includes(payment_category)
    )
      return res
        .status(400)
        .json({ error: "Invalid payment type" }, { status: 400 });
    let whereClause = {
      trash: false,
      school_id: school_id,
      payment_category: { [Op.ne]: "donation" },
    };

    if (payment_category) {
      whereClause.payment_category = payment_category;
    }
    if (payment_method) {
      whereClause.payment_method = payment_method;
    }
    if (payment_status) {
      whereClause.payment_status = payment_status;
    }
    if (student_id) {
      whereClause.student_id = student_id;
    }
    if (start_date) {
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.gte]: new Date(startDate),
      };
    }
    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(endDate),
      };
    }
    let whereStudent = {};
    if (class_id) {
      whereStudent.class_id = class_id;
    }
    if (searchQuery) {
      whereStudent[Op.or] = [
        { full_name: { [Op.like]: `%${searchQuery}%` } },
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { count, rows: payment } = await Payment.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "roll_number", "reg_no", "class_id"],
          where: whereStudent,
          include: [
            {
              model: Class,
              attributes: ["id", "classname"],
              where: year ? { year } : {},
            },
          ],
        },
        {
          model: InvoiceStudent,
          attributes: ["id", "status"],
          include: [
            {
              model: Invoice,
              attributes: ["id", "title", "category"],
              required: true,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      payment,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getAllPayments :", error);
    res.status(500).json({ error: error.message });
  }
};
const getDonations = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const payment_method = req.query.payment_method || "";
    const payment_status = req.query.payment_status || "";
    const class_id = req.query.class_id || null;
    const year = req.query.year || null;
    const start_date = req.query.start_date || null;
    const end_date = req.query.end_date || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {
      trash: false,
      school_id: school_id,
      payment_category: "donation",
    };

    if (payment_method) {
      whereClause.payment_method = payment_method;
    }
    if (payment_status) {
      whereClause.payment_status = payment_status;
    }
    if (start_date) {
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.gte]: new Date(startDate),
      };
    }
    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(endDate),
      };
    }
    let whereStudent = {};
    if (class_id) {
      whereStudent.class_id = class_id;
    }
    if (searchQuery) {
      whereStudent[Op.or] = [
        { full_name: { [Op.like]: `%${searchQuery}%` } },
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: payment } = await Payment.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "roll_number", "class_id"],
          where: whereStudent,
          include: [
            {
              model: Class,
              attributes: ["id", "classname"],
              where: year ? { year } : {},
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      payment,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getAllPayments :", error);
    res.status(500).json({ error: error.message });
  }
};
const getPaymentById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const payment = await Payment.findOne({
      where: { id: req.params.id, school_id, trash: false },
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image"],
        },
        {
          model: User,
          as: "recorded",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "updated",
          attributes: ["id", "name"],
        },
      ],
    });
    if (!payment || payment.trash)
      return res.status(404).json({ error: "Payment not found" });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const paymentVerification = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const userId = req.user.user_id;
    const id = req.params.id;
    const status = req.body.status;
    if (!["completed", "failed"].includes(status)) {
      return res.status(400).json({
        error: "Invalid payment status",
      });
    }

    const result = await schoolSequelize.transaction(async (transaction) => {
      const payment = await Payment.findOne({
        where: {
          id,
          school_id,
          trash: false,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      payment.payment_status = status;
      payment.updated_by = userId;

      await payment.save({
        transaction,
      });

      let invoice_status = "";

      if (
        status === "completed" &&
        payment.invoice_student_id
      ) {
        const invoiceStudent = await InvoiceStudent.findOne({
          where: {
            id: payment.invoice_student_id,
          },
          include: [
            {
              model: Invoice,
              attributes: ["id", "amount"],
            },
          ],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!invoiceStudent) {
          throw new Error("Invoice student not found");
        }

        const totalPaid =
          (await Payment.sum("amount", {
            where: {
              invoice_student_id: payment.invoice_student_id,
              payment_status: "completed",
              trash: false,
            },
            transaction,
          })) || 0;

        const invoiceAmount =
          Number(invoiceStudent?.Invoice?.amount) || 0;

        const paidAmount = Number(totalPaid);

        if (paidAmount >= invoiceAmount) {
          await invoiceStudent.update(
            {
              status: "paid",
            },
            {
              transaction,
            }
          );

          invoice_status = "paid";
        } else {
          await invoiceStudent.update(
            {
              status: "partially_paid",
            },
            {
              transaction,
            }
          );

          invoice_status = "partially_paid";
        }
      }
      return {
        payment,
        invoice_status,
      };
    });

    return res.status(200).json({
      message: "Payment verification successful",
      payment: result.payment,
      invoice_status: result.invoice_status,
    });

  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "paymentVerification:",
      error
    );

    if (error.message === "Payment not found") {
      return res.status(404).json({
        error: error.message,
      });
    }

    if (error.message === "Invoice student not found") {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: error.message,
    });
  }
};

const updatePayment = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const userId=req.user.user_id;
    const {
      student_id,
      amount,
      payment_date,
      payment_category,
      transaction_id,
      payment_status,
      payment_method,
    } = req.body;
    if (!amount || !payment_date || !payment_category || !student_id) {
      return res.status(400).json({
        error: "student_id,amount,payment_date,payment_category are required",
      });
    }
    const Id = req.params.id;
    const payment = await Payment.findOne({
      where: { id: Id, school_id },
    });
    if (!payment || payment.trash)
      return res.status(404).json({ error: "Payment not found" });
    const existingTransaction_id = await Payment.findOne({
      where: { transaction_id, id: { [Op.ne]: req.params.id } },
    });
    if (
      existingTransaction_id &&
      existingTransaction_id.transaction_id !== ""
    ) {
      return res.status(400).json({ error: "Transaction ID already exists" });
    }

    const existingPayment = await Payment.findOne({
      where: {
        school_id,
        student_id,
        amount,
        payment_date,
        payment_category,

        id: { [Op.ne]: Id },
      },
    });
    if (existingPayment) {
      return res
        .status(400)
        .json({ error: "Payment with the same details already exists" });
    }

    let invoice_status = "";
    if (
      payment.payment_status !== "completed" &&
      payment_status === "completed" &&
      payment.invoice_student_id
    ) {
      const invoiceStudent = await InvoiceStudent.findOne({
        where: { id: payment.invoice_student_id },
        include: [{ model: Invoice, attributes: ["id", "amount"] }],
      });
      let totalPaid = 0;
      if (payment.invoice_student_id) {
        totalPaid = await Payment.sum("amount", {
          where: {
            invoice_student_id: payment.invoice_student_id,
            payment_status: "completed",
          },
        });
      }
      const paid = amount + totalPaid;
      const invoiceAmount = invoiceStudent?.Invoice?.amount || 0;

      if (invoiceStudent && paid >= invoiceAmount) {
        await invoiceStudent.update({ status: "paid" });
        invoice_status = "paid";
      } else {
        await invoiceStudent.update({ status: "partially_paid" });
        invoice_status = "partially_paid";
      }
    }

    await payment.update({
      student_id,
      amount,
      payment_date,
      payment_category,
      transaction_id,
      payment_status,
      payment_method,
      updated_by:userId,
    });
    res.status(200).json({ message: "Payment updated", payment });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "updatePayment :", error);
    res.status(500).json({ error: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const payment = await Payment.findOne({
      where: { id: req.params.id, school_id, trash: false },
    });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    await Payment.update(
      { trash: true },
      { where: { id: req.params.id, school_id } },
    );
    res.status(200).json({ message: "Payment soft deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTrashedPayments = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const payment_category = req.query.payment_category || "";
    const payment_method = req.query.payment_method || "";
    const payment_status = req.query.payment_status || "";
    const class_id = req.query.class_id || null;
    const year = req.query.year || null;
    const student_id = req.query.student_id || null;
    const start_date = req.query.start_date || null;
    const end_date = req.query.end_date || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    if (
      payment_category &&
      ![
        "tuition",
        "admission",
        "exam",
        "transport",
        "hostel",
        "lab",
        "library",
        "activity",
        "fine",
        "event",
        "excursion",
        "other",
      ].includes(payment_category)
    )
      return res
        .status(400)
        .json({ error: "Invalid payment type" }, { status: 400 });
    let whereClause = {
      trash: true,
      school_id: school_id,
      payment_category: { [Op.ne]: "donation" },
    };

    if (payment_category) {
      whereClause.payment_category = payment_category;
    }
    if (payment_method) {
      whereClause.payment_method = payment_method;
    }
    if (payment_status) {
      whereClause.payment_status = payment_status;
    }
    if (student_id) {
      whereClause.student_id = student_id;
    }
    if (start_date) {
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.gte]: new Date(startDate),
      };
    }
    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(endDate),
      };
    }
    let whereStudent = {};
    if (class_id) {
      whereStudent.class_id = class_id;
    }
    if (searchQuery) {
      whereStudent[Op.or] = [
        { full_name: { [Op.like]: `%${searchQuery}%` } },
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: payment } = await Payment.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "roll_number", "reg_no", "class_id"],
          where: whereStudent,
          include: [
            {
              model: Class,
              attributes: ["id", "classname"],
              where: year ? { year } : {},
            },
          ],
        },
        {
          model: InvoiceStudent,
          attributes: ["id", "status"],
          include: [
            {
              model: Invoice,
              attributes: ["id", "title", "category"],
              required: true,
            },
          ],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      payment,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getAllPayments :", error);
    res.status(500).json({ error: error.message });
  }
};
const getTrashedDonations = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const payment_method = req.query.payment_method || "";
    const payment_status = req.query.payment_status || "";
    const class_id = req.query.class_id || null;
    const year = req.query.year || null;
    const start_date = req.query.start_date || null;
    const end_date = req.query.end_date || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {
      trash: true,
      school_id: school_id,
      payment_category: "donation",
    };
    if (payment_method) {
      whereClause.payment_method = payment_method;
    }
    if (payment_status) {
      whereClause.payment_status = payment_status;
    }
    if (start_date) {
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.gte]: new Date(startDate),
      };
    }
    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(endDate),
      };
    }
    let whereStudent = {};
    if (class_id) {
      whereStudent.class_id = class_id;
    }
    if (searchQuery) {
      whereStudent[Op.or] = [
        { full_name: { [Op.like]: `%${searchQuery}%` } },
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: payment } = await Payment.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "roll_number", "class_id"],
          where: whereStudent,
          include: [
            {
              model: Class,
              attributes: ["id", "classname"],
              where: year ? { year } : {},
            },
          ],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      payment,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getAllPayments :", error);
    res.status(500).json({ error: error.message });
  }
};
const restorePayment = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const payment = await Payment.findOne({
      where: { id: req.params.id, school_id, trash: true },
    });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    await Payment.update(
      { trash: false },
      { where: { id: req.params.id, school_id, trash: true } },
    );
    res.status(200).json({ message: "Payment restored successfully" });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "restorePayment :", error);
    res.status(500).json({ error: error.message });
  }
};
const permanentDeletePayment = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    const data = await Payment.findOne({
      where: {  id: req.params.id , school_id, trash: true, },
    });
    if (!data) {
      return res.status(404).json({
        error: "Payment not found ",
      });
    }
    if(data.payment_attachment){
      await deleteFile(data.payment_attachment);
    }
    await Payment.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.status(200).json({ message: "Payment permanently deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const addSpecialClassStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { class_id, student_ids } = req.body;

    if (!class_id || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: "class_id and student_ids are required" });
    }

    const classRecord = await Class.findOne({
      where: { id: class_id, school_id, trash: false },
    });

    if (!classRecord) {
      return res.status(404).json({ error: "Class not found" });
    }

    const validStudents = await Student.findAll({
      where: { id: student_ids, school_id, trash: false },
    });

    if (validStudents.length !== student_ids.length) {
      return res.status(400).json({ error: "One or more students are invalid" });
    }

    const existingAssignments = await SpecialClassStudent.findAll({
      where: { class_id, student_id: student_ids },
      attributes: ["student_id"],
    });

    const existingStudentIds = new Set(existingAssignments.map((item) => item.student_id));
    const newAssignments = student_ids
      .filter((student_id) => !existingStudentIds.has(student_id))
      .map((student_id) => ({ class_id, student_id }));

    if (newAssignments.length === 0) {
      return res.status(200).json({ message: "All selected students are already assigned" });
    }

    await SpecialClassStudent.bulkCreate(newAssignments);

    res.status(201).json({
      message: "Students added to special class successfully",
      addedCount: newAssignments.length,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "addSpecialClassStudents:", error);
    res.status(500).json({ error: error.message });
  }
};

const getSpecialClassStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const class_id = req.query.class_id || null;
    const student_id = req.query.student_id || null;
    const searchQuery = req.query.q || "";
    const studentWhere = {
      school_id,
      trash: false,
    };
    if (searchQuery) {
      studentWhere.full_name = { [Op.like]: `%${searchQuery}%` };
    }
    let whereClause = {};
    if (class_id) {
      whereClause.class_id = class_id;
    }
    if (student_id) {
      whereClause.student_id = student_id;
    }
    const { count, rows: data } = await SpecialClassStudent.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Class,
          attributes: ["id", "year", "division", "classname"],
        },
        {
          model: Student,
          where: studentWhere,
          attributes: ["id", "full_name", "roll_number", "class_id"],
          include:[{
            model:Class,
            attributes:["classname"]
          }
          ]
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      data,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getSpecialClassStudents:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteSpecialClassStudent = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { id} = req.params;

    const assignment = await SpecialClassStudent.findByPk(id);

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    const classRecord = await Class.findOne({
      where: { id: assignment.class_id, school_id, trash: false },
    });

    if (!classRecord) {
      return res.status(404).json({ error: "Class not found or you don't have permission" });
    }

    await assignment.destroy();

    res.status(200).json({ message: "Student removed from special class successfully" });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "deleteSpecialClassStudent:", error);
    res.status(500).json({ error: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { title, description, amount, due_date, category, student_ids } =
      req.body;
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;

    if (!title || !amount || !category || !due_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existingInvoice = await Invoice.findOne({
      where: { school_id, title, category, due_date },
    });
    if (existingInvoice) {
      return res.status(400).json({
        error:
          "An invoice with the same title, due date and category already exists",
      });
    }
    const invoice = await Invoice.create({
      school_id,
      title,
      description,
      amount,
      due_date,
      category,
      recorded_by,
    });

    if (Array.isArray(student_ids) && student_ids.length > 0) {
      const invoiceStudents = student_ids.map((sid) => ({
        invoice_id: invoice.id,
        student_id: sid,
        status: "pending",
      }));
      await InvoiceStudent.bulkCreate(invoiceStudents);
    }

    res.status(201).json(invoice);
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "createInvoice :", error);
    res.status(500).json({ error: error.message });
  }
};
const addInvoiceStudentsbyInvoiceId = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const {
      student_ids, // array of student_ids to attach
    } = req.body;

    const invoice = await Invoice.findOne({
      where: { id, school_id, trash: false },
    });
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (student_ids && Array.isArray(student_ids)) {
      const students = await Student.findAll({
        where: { id: student_ids, school_id, trash: false },
      });
      if (!students || students.length !== student_ids.length) {
        return res
          .status(400)
          .json({ error: "One or more students not found in this school" });
      }

      const invoiceStudents = student_ids.map((student_id) => ({
        invoice_id: id,
        student_id,
        status: "pending",
      }));

      await InvoiceStudent.bulkCreate(invoiceStudents);
    }

    res
      .status(200)
      .json({ success: true, message: "Invoice updated successfully" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "addInvoiceStudentsbyInvoiceId :",
      error,
    );
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
};
const getAllInvoices = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
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
    if (date) {
      whereClause.due_date = date;
    }
    const { count, rows: invoices } = await Invoice.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      invoices,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getAllInvoices :", error);
    res.status(500).json({ error: error.message });
  }
};
const getInvoiceById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, school_id, trash: false },
      include: [
        {
          model: InvoiceStudent,
          include: [
            {
              model: Student,
              attributes: ["id", "full_name", "reg_no"],
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
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, amount, due_date, category } = req.body;
    const school_id = req.user.school_id;
    const invoice = await Invoice.findOne({
      where: { id, school_id, trash: false },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    await invoice.update({
      title,
      description,
      amount,
      due_date,
      category,
    });
    res.status(200).json({ message: "Invoice updated", invoice });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "updateInvoice :", error);
    res.status(500).json({ error: error.message });
  }
};
const deleteInvoice = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    await Invoice.update(
      { trash: true },
      { where: { id: req.params.id, school_id } },
    );
    res.status(200).json({ message: "Invoice soft deleted" });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "deleteInvoice :", error);
    res.status(500).json({ error: error.message });
  }
};
const getTrashedInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school_id = req.user.school_id;
    const { count, rows: invoices } = await Invoice.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { school_id, trash: true },
      order: [["updatedAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      invoices,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getTrashedInvoices :", error);
    res.status(500).json({ error: error.message });
  }
};
const restoreInvoice = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, school_id, trash: true },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    await invoice.update({ trash: false });
    res.status(200).json({ message: "Invoice restored" });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "restoreInvoice :", error);
    res.status(500).json({ error: error.message });
  }
};
const permanentDeleteInvoiceStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const invoiceStudent = await InvoiceStudent.findByPk(id);
    if (!invoiceStudent) {
      return res.status(404).json({ error: "Not found" });
    }
    const invoice = await Invoice.findOne({
      where: { id: invoiceStudent.invoice_id, school_id },
    });
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    await invoiceStudent.destroy();
    res.status(200).json({ message: "Invoice student deleted" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "permanentDeleteInvoiceStudent :",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
// Leave Request Management
// const leaverequestFilePath = "uploads/leave_requests/";

const createLeaveRequest = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const admin_id = req.user.user_id;
    const {
      user_id,
      student_id,
      role,
      from_date,
      to_date,
      leave_type,
      reason,
      leave_duration,
      status,
      admin_remarks,
    } = req.body;
    if (!from_date || !to_date || !leave_type || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existingRequest = await LeaveRequest.findOne({
      where: {
        school_id: school_id,
        user_id: user_id || null,
        student_id: student_id || null,
        from_date: from_date,
        to_date: to_date,
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already exists" });
    }

    const attachmentUrl = req.uploadedFiles?.attachment?.url || null;

    const data = await LeaveRequest.create({
      school_id: school_id,
      user_id: user_id ? user_id : admin_id,
      student_id: student_id,
      role: role ? role : "student",
      from_date: from_date,
      to_date: to_date,
      leave_type: leave_type,
      reason: reason,
      attachment: attachmentUrl ? attachmentUrl : null,
      leave_duration,
      status: status ? status : "pending",
      admin_remarks,
    });
    res.status(201).json(data);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "createLeaveRequest :",
      error,
    );
    console.error("Create Error:", error);
    res.status(500).json({ error: "Failed to create leave request" });
  }
};

const getLeaveRequestById = async (req, res) => {
  try {
    const Id = req.params.id;
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const data = await LeaveRequest.findOne({
      where: {
        id: Id,
        school_id,
        trash: false,
      },
    });
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "getLeaveRequestById :",
      error,
    );
    console.error("Fetch One Error:", error);
    res.status(500).json({ error: "Failed to fetch leave request" });
  }
};
const updateLeaveRequest = async (req, res) => {
  try {
    const Id = req.params.id;
    const school_id = req.user.school_id;
    const {
      user_id,
      student_id,
      from_date,
      to_date,
      leave_type,
      reason,
      leave_duration,
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

    const newFileUrl = req.uploadedFiles?.attachment?.url || null;
    let finalFile = data.attachment;

    if (newFileUrl) {
      if (data.attachment) {
        await deleteFile(data.attachment);
      }
      finalFile = newFileUrl;
    }
    await data.update({
      student_id: student_id,
      from_date: from_date,
      to_date: to_date,
      leave_type: leave_type,
      reason: reason,
      attachment: finalFile ? finalFile : null,
      leave_duration,
    });

    res.status(200).json(data);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "updateLeaveRequest :",
      error,
    );
    console.error("Update Error:", error);
    res.status(500).json({ error: "Failed to update leave request" });
  }
};
const leaveRequestPermission = async (req, res) => {
  try {
    const Id = req.params.id;
    const school_id = req.user.school_id;
    const userId = req.user.user_id;
    const status = req.query.status;
    const admin_remarks = req.query.admin_remarks;

    if (!userId || !status) {
      return res.status(400).json({ error: "User ID and status are required" });
    }

    const leaveRequest = await LeaveRequest.findOne({
      where: { id: Id, trash: false, school_id },
    });
    if (!leaveRequest) return res.status(404).json({ error: "Not found" });

    const SchoolDetails = await School.findOne({
      where: { id: school_id },
      attributes: ["attendance_count"],
    });
    const attendance_count = SchoolDetails.attendance_count;

    leaveRequest.approved_by = userId;
    leaveRequest.admin_remarks = admin_remarks;

    if (status === "approved") {
      leaveRequest.status = "approved";

      const student_id = leaveRequest.student_id;
      const fromDate = moment(leaveRequest.from_date);
      const toDate = moment(leaveRequest.to_date);
      const student = await Student.findOne({
        where: { id: student_id },
      });

      // ✅ Determine period count based on leave type (half/full)
      let periodCount;
      if (leaveRequest.leave_duration === "half") {
        periodCount = Math.ceil(attendance_count / 2); // odd numbers → ceiling
      } else {
        periodCount = attendance_count; // full leave = all periods
      }
      const dates = [];
      let current = moment(fromDate);
      while (current.isSameOrBefore(toDate, "day")) {
        dates.push(current.format("YYYY-MM-DD"));
        current.add(1, "days");
      }

      for (const date of dates) {
        // ✅ Loop through each period
        for (let period = 1; period <= periodCount; period++) {
          let attendance = await Attendance.findOrCreate({
            where: {
              school_id,
              date,
              class_id: student.class_id,
              period, // ✅ store period number individually
            },
          });
          const attendanceRecord = await AttendanceMarked.findOne({
            where: {
              attendance_id: attendance[0].id,
              student_id,
            },
          });

          if (attendanceRecord) {
            // update existing
            await attendanceRecord.update({
              status: "leave",
              remarks:
                leaveRequest.leave_type === "half"
                  ? "Half-day Leave approved"
                  : "Full-day Leave approved",
            });
          } else {
            // create new
            await AttendanceMarked.create({
              attendance_id: attendance[0].id,
              student_id,
              status: "leave",
              remarks:
                leaveRequest.leave_type === "half"
                  ? "Half-day Leave approved"
                  : "Full-day Leave approved",
            });
          }
        }
      }
    } else if (status === "rejected") {
      leaveRequest.status = "rejected";
    } else {
      return res.status(400).json({ error: "Invalid status" });
    }

    await leaveRequest.save();
    res.status(200).json({
      message: `Leave request ${status} successfully`,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "leaveRequestPermission :",
      error,
    );
    console.error("Approve Error:", error);
    res.status(500).json({ error: "Failed to approve leave request" });
  }
};
const staffLeaveRequestPermission = async (req, res) => {
  try {
    const Id = req.params.id;
    const user_id = req.user.user_id;
    const status = req.query.status;
    const admin_remarks = req.query.admin_remarks;
    const school_id = req.user.school_id;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const leaveRequest = await LeaveRequest.findOne({
      where: { id: Id, trash: false, school_id },
    });

    if (!leaveRequest) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    // Update leave request
    leaveRequest.approved_by = user_id;
    leaveRequest.admin_remarks = admin_remarks || null;
    leaveRequest.status = status;
    await leaveRequest.save();

    // If approved, add attendance entries for the leave period
    if (status === "approved" && leaveRequest.leave_duration === "full") {
      const fromDate = moment(leaveRequest.from_date);
      const toDate = moment(leaveRequest.to_date);

      const staff_id = leaveRequest.user_id;
      const attendanceEntries = [];

      for (
        let date = moment(fromDate);
        date.isSameOrBefore(toDate);
        date.add(1, "days")
      ) {
        attendanceEntries.push({
          school_id,
          staff_id,
          date: date.format("YYYY-MM-DD"),
          status: "Leave",
          check_in_time: null,
          check_out_time: null,
          created_at: new Date(),
          updated_at: new Date(),
          marked_method: "Leaverequest",
          marked_by: user_id,
        });
      }

      // Bulk insert attendance entries
      await StaffAttendance.bulkCreate(attendanceEntries, {
        ignoreDuplicates: true, // avoid duplicates if already exists
      });
    }

    res.status(200).json({
      message: `Leave request ${status} successfully`,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "staffLeaveRequestPermission :",
      error,
    );
    console.error("Approve Error:", error);
    res.status(500).json({ error: "Failed to approve leave request" });
  }
};
const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const leave = await LeaveRequest.findOne({
      where: {
        id: id,
        trash: false,
        school_id: school_id,
      },
    });
    if (!leave) return res.status(404).json({ error: "Not found" });

    await leave.update({ trash: true });
    res.status(200).json("Successfully soft deleted");
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting leave request:",
      error,
    );
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Failed to delete leave request" });
  }
};
const getTrashedLeaveRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";

    const whereClause = {
      trash: true,
      school_id: school_id,
    };

    if (searchQuery) {
      whereClause[Op.or] = [{ reason: { [Op.like]: `%${searchQuery}%` } }];
    }

    const { count, rows: leaveRequests } = await LeaveRequest.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [["updatedAt", "DESC"]],
    });

    res.status(200).json({
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      data: leaveRequests,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting trashed leave requests:",
      error,
    );
    console.error("Get Trashed Leave Requests Error:", error);
    res.status(500).json({ error: "Failed to get trashed leave requests" });
  }
};
const restoreLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const leave = await LeaveRequest.findOne({
      where: { id: id, trash: true, school_id },
    });
    if (!leave) return res.status(404).json({ error: "Not found" });

    await leave.update({ trash: false });
    res.status(200).json("Successfully restored");
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error restoring leave request:",
      error,
    );
    console.error("Restore Error:", error);
    res.status(500).json({ error: "Failed to restore leave request" });
  }
};
const permanentDeleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const leave = await LeaveRequest.findOne({
      where: { id: id, trash: true, school_id },
    });
    if (!leave) return res.status(404).json({ error: "Not found" });
    if (leave.attachment) {
      await deleteFile(leave.attachment);
    }
    await leave.destroy();

    res.status(200).json("Successfully permanently deleted");
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error permanently deleting leave request:",
      error,
    );
    console.error("Permanent Delete Error:", error);
    res
      .status(500)
      .json({ error: "Failed to permanently delete leave request" });
  }
};
//get all staff leave request
const getAllStaffLeaveRequests = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      school_id: school_id,
      role: "staff",
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
    const { count, rows: leaveRequests } = await LeaveRequest.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      leaveRequests,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching all leave requests:",
      error,
    );
    console.error("Fetch All Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};
const getAllTeacherLeaveRequests = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      school_id: school_id,
      role: "teacher",
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
    const { count, rows: leaveRequests } = await LeaveRequest.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      leaveRequests,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching all leave requests:",
      error,
    );
    console.error("Fetch All Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};

const getAllStudentLeaveRequests = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const class_id = req.query.class_id || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      school_id: school_id,
      role: "student",
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
    const { count, rows: leaveRequests } = await LeaveRequest.findAndCountAll({
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
        "leave_duration",
        "status",
      ],
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image"],
          where: class_id ? { class_id } : {},
          include: [
            {
              model: Class,
              attributes: ["id", "classname"],
            },
          ],
        },
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      leaveRequests,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching all leave requests:",
      error,
    );
    console.error("Fetch All Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};
const newsimagePath = "uploads/news_images/";
// const newsfilePath = "uploads/news_files/";
const createNews = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    const { title, content, date } = req.body;

    if (!school_id || !title || !date) {
      return res.status(400).json({ error: "required fields are missing" });
    }
    const existingNews = await News.findOne({
      where: { school_id, title },
    });
    if (existingNews) {
      return res
        .status(400)
        .json({ error: "news with the same title already exists" });
    }
    const news = await News.create({
      school_id,
      title,
      content,
      date,
      user_id,
    });

    const uploadedImages = req.uploadedFiles?.images || [];

    if (uploadedImages.length > 0) {
      const imageRecords = uploadedImages.map((img) => ({
        news_id: news.id,
        image_url: img.url,
      }));

      await NewsImage.bulkCreate(imageRecords);
    }
    res.status(201).json(news);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error creating news:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

const getAllNews = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause = {
      trash: false,
      school_id: school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: news } = await News.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: NewsImage,
          as: "images",
          where: { trash: false },
          attributes: ["id", "image_url", "caption"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      news,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching all news:",
      error,
    );
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const news = await News.findOne({
      where: { id: id, trash: false, school_id: school_id },
      include: [
        {
          model: NewsImage,
          as: "images",
          where: { trash: false },
          attributes: ["id", "image_url", "caption"],
          required: false,
        },
      ],
    });
    if (!news) return res.status(404).json({ error: "Not found" });
    res.json(news);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching news by id:",
      error,
    );
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};

const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const { title, content, date } = req.body;
    const news = await News.findOne({
      where: { id: id, school_id: school_id, trash: false },
    });
    if (!news) {
      return res.status(404).json({ error: "Not found" });
    }
    const existingNews = await News.findOne({
      where: { title, id: { [Op.ne]: id } },
    });
    if (existingNews) {
      return res
        .status(409)
        .json({ error: "News with the same title already exists" });
    }

    await news.update({ title, content, date });
    const uploadedImages = req.uploadedFiles?.images || [];

    if (uploadedImages.length > 0) {
      const oldImages = await NewsImage.findAll({
        where: { news_id: news.id },
      });

      for (const img of oldImages) {
        if (img.image_url) {
          await deleteFile(img.image_url);
        }
      }
      await NewsImage.destroy({
        where: { news_id: news.id },
      });
      const imageRecords = uploadedImages.map((img) => ({
        news_id: news.id,
        image_url: img.url,
      }));

      await NewsImage.bulkCreate(imageRecords);
    }
    const updatedNews = await News.findOne({
      where: {
        id: id,
      },
      include: [
        {
          model: NewsImage,
          as: "images",
          attributes: ["id", "image_url", "caption"],
        },
      ],
    });

    res.json({ message: "Updated", news: updatedNews });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating news:",
      error,
    );
    console.error("Update Error:", error);
    res.status(500).json({ error: "Failed to update news" });
  }
};

const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const news = await News.findOne({
      where: { id: id, school_id: school_id, trash: false },
    });
    if (!news) return res.status(404).json({ error: "Not found" });
    await news.update({ trash: true });
    res.json({ message: "Soft deleted" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting news:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getTrashedNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school_id = req.user.school_id;
    const searchQuery = req.query.search || "";
    let whereClause = {
      trash: true,
      school_id: school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: news } = await News.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: NewsImage,
          where: { trash: false },
          attributes: ["id", "image_url", "caption"],
          required: false,
        },
      ],
      order: [["updatedAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      news,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching trashed news:",
      error,
    );
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};
const restoreNews = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { id } = req.params;
    const news = await News.findOne({ where: { id, trash: true, school_id } });
    if (!news) return res.status(404).json({ error: "Not found" });
    await news.update({ trash: false });
    res.json({ message: "Restored" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error restoring news:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const permanentDeleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const news = await News.findOne({ where: { id, trash: true, school_id } });
    if (!news) return res.status(404).json({ error: "Not found" });
    const newsImages = await NewsImage.findAll({
      where: { news_id: id },
    });
    for (const img of newsImages) {
      if (img.image_url) {
        await deleteFile(img.image_url);
      }
    }
    await NewsImage.destroy({
      where: { news_id: id },
    });
    await news.destroy();

    res.json({ message: "Permanently deleted" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error permanently deleting news:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const deleteNewsImage = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const newsImage = await NewsImage.findOne({ where: { id, trash: false } });
    const news = await News.findOne({
      where: { id: newsImage.news_id, school_id, trash: false },
    });
    if (!news) return res.status(404).json({ error: "Not found" });
    if (!newsImage) return res.status(404).json({ error: "Not found" });
    if (newsImage.image_url) {
      await deleteFile(newsImage.image_url);
    }
    await newsImage.destroy();

    res.json({ message: "Soft deleted" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting news image:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
// Notice Management
const createNotice = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { title, content, type, class_ids } = req.body;
    const date = req.body.date ? req.body.date : new Date();

    if (!school_id || !title || !content || !type) {
      return res.status(400).json({ error: "required fields are missing" });
    }
    const existingNotice = await Notice.findOne({
      where: { school_id, title, type, date },
    });
    if (existingNotice) {
      return res
        .status(400)
        .json({ error: "Notice with the same title,date already exists" });
    }

    const noticeFileUrl = req.uploadedFiles?.file?.url || null;
    const notice = await Notice.create({
      school_id,
      title,
      content,
      file: noticeFileUrl,
      type,
      date,
      recorded_by: req.user.user_id,
    });

    if (type === "classes" && Array.isArray(class_ids)) {
      const mappings = class_ids.map((cid) => ({
        notice_id: notice.id,
        class_id: cid,
      }));
      await NoticeClass.bulkCreate(mappings);
    }

    res.status(201).json({ message: "Notice created", notice });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error creating notice:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

const getAllNotices = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const school_id = req.user.school_id;
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
        { content: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const count = await Notice.count({ where: whereClause });
    const notices = await Notice.findAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: NoticeClass,
          include: [{ model: Class, attributes: ["id", "classname"] }],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      notices,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting notices:",
      error,
    );
  }
};
const getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const notice = await Notice.findOne({
      where: { id: id, trash: false, school_id: school_id },
      include: [
        {
          model: NoticeClass,
          attributes: ["id", "class_id"],
          include: [{ model: Class, attributes: ["id", "classname"] }],
          required: false,
        },
      ],
    });
    if (!notice) return res.status(404).json({ error: "Notice not found" });

    const formattedNotice = {
      id: notice.id,
      school_id: notice.school_id,
      title: notice.title,
      content: notice.content,
      file: notice.file,
      type: notice.type,
      date: notice.date,
      trash: notice.trash,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
      NoticeClasses: notice.NoticeClasses.map((nc) => ({
        id: nc.id,
        class_id: nc.class_id,
        classname: nc.Class ? nc.Class.classname : null,
      })),
    };
    res.json(formattedNotice);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error("Error getting notice by id:", error);
  }
};

const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const { title, content, type, class_ids, date } = req.body;
    if (!title || !content || !type) {
      return res.status(400).json({ error: "required fields are missing" });
    }
    const notice = await Notice.findOne({
      where: { id: id, school_id: school_id, trash: false },
    });
    const existingNotice = await Notice.findOne({
      where: {
        school_id: notice.school_id,
        title,
        type,
        date,
        id: { [Op.ne]: id },
      },
    });
    if (existingNotice) {
      return res
        .status(409)
        .json({ error: "Notice with the same title already exists" });
    }
    if (!notice) return res.status(404).json({ error: "Notice not found" });

    const newFileUrl = req.uploadedFiles?.file?.url || null;

    let finalFile = notice.file || null;
    if (newFileUrl) {
      if (notice.file) {
        await deleteFile(notice.file);
      }
      finalFile = newFileUrl;
    }

    await notice.update({ title, content, type, file: finalFile });

    if (type === "classes") {
      await NoticeClass.destroy({ where: { notice_id: id } });
      const mappings = class_ids.map((cid) => ({
        notice_id: id,
        class_id: cid,
      }));
      await NoticeClass.bulkCreate(mappings);
    }

    res.json({ message: "Notice updated" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating notice:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const [rows] = await Notice.update(
      { trash: true },
      { where: { id: id, school_id } },
    );
    if (!rows) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Notice soft-deleted" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting notice:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const permanentDeleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const notice = await Notice.findOne({
      where: { id: id, trash: true, school_id },
    });
    if (!notice) return res.status(404).json({ error: "Not found" });
    if (notice.file) {
      await deleteFile(notice.file);
    }
    await NoticeClass.destroy({ where: { notice_id: id } });
    await notice.destroy();
    res.json({ message: "Notice permanently deleted" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error permanently deleting notice:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getTrashedNotices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const school_id = req.user.school_id;
    const notices = await Notice.findAll({
      offset,
      distinct: true,
      limit,
      where: {
        school_id: school_id,
        trash: true,
      },
      include: [
        {
          model: NoticeClass,
          attributes: ["id", "class_id"],
          include: [{ model: Class, attributes: ["id", "classname"] }],
          required: false,
        },
      ],

      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(notices.length / limit);
    res.status(200).json({
      totalcontent: notices.length,
      totalPages,
      currentPage: page,
      notices,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting trashed notices:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const restoreNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const notice = await Notice.findOne({
      where: { id, trash: true, school_id },
    });
    if (!notice) return res.status(404).json({ error: "Not found" });
    await notice.update({ trash: false });
    res.json({ message: "Notice restored" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error restoring notice:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getLatestNotices = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    // const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;
    const { count, rows: notices } = await Notice.findAndCountAll({
      where: {
        school_id: school_id,
      },
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
      notices,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching latest notices:",
      error,
    );
    console.error("Error fetching notices:", error);
    res.status(500).json({ error: "Failed to fetch notices" });
  }
};
// Timetable Management
const bulkUpsertTimetable = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    let { records } = req.body;
    for (const record of records) {
      const staff = await User.findOne({
        where: {
          id: record.staff_id,
          school_id,
          role: "teacher",
        },
        attributes: ["id", "trash"],
      });
      if (!staff) {
        return res.status(400).json({ error: "Invalid staff_id" });
      }

      if (staff.trash) {
        return res.status(400).json({
          error:
            "One or more assigned teachers no longer exists, Please remove them from the timetable before saving.",
        });
      }
    }
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: "Invalid records format" });
    }
    records = records.map((record) => ({
      ...record,
      school_id,
    }));
    await Timetable.bulkCreate(records, {
      updateOnDuplicate: ["subject_id", "staff_id", "updatedAt"],
    });
    return res.json({
      success: true,
      message: "Timetable updated successfully",
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "bulkUpsertTimetable error:",
      error,
    );
    console.error("bulkUpsertTimetable error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getAllTimetables = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.query.class_id;
    const day_of_week = req.query.day_of_week;
    const period_number = req.query.period_number;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || "";
    const whereClause = {
      school_id,
    };
    if (class_id) {
      whereClause.class_id = class_id;
    }
    if (day_of_week) {
      whereClause.day_of_week = day_of_week;
    }
    if (period_number) {
      whereClause.period_number = period_number;
    }
    const { count, rows: timetable } = await Timetable.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Class,
          attributes: ["classname"],
          where: searchQuery
            ? { classname: { [Op.like]: `%${searchQuery}%` } }
            : {},
        },
        {
          model: Subject,
          attributes: ["subject_name"],
        },
        {
          model: User,
          attributes: ["name"],
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      timetable,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching timetable:",
      error,
    );
    console.error("Error fetching timetable:", error);
    res.status(500).json({ error: "Failed to fetch timetable" });
  }
};
const getTimetableById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const timetableEntry = await Timetable.findOne({
      where: { id: id, school_id },
      include: [
        {
          model: Class,
          attributes: ["class_name"],
        },
        {
          model: Subject,
          attributes: ["subject_name"],
        },
        {
          model: User,
          attributes: ["name"],
        },
      ],
    });
    if (!timetableEntry) {
      return res.status(404).json({ error: "Timetable entry not found" });
    }
    res.json(timetableEntry);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching timetable entry:",
      error,
    );
    console.error("Error fetching timetable entry:", error);
    res.status(500).json({ error: "Failed to fetch timetable entry" });
  }
};
//delete timetable entry
const deleteTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const timetableEntry = await Timetable.findOne({
      where: { id, school_id },
    });
    if (!timetableEntry) {
      return res.status(404).json({ error: "Timetable entry not found" });
    }
    //destroy entry
    await timetableEntry.destroy();
    res.json({ message: "Timetable deleted" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Delete Timetable Entry Error:",
      error,
    );
    console.error("Delete Timetable Entry Error:", error);
    res.status(500).json({ error: "Failed to delete timetable entry" });
  }
};

const getTimetablesWithClassId = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.params.class_id;

    const schoolDetails = await School.findOne({
      where: { id: school_id },
      attributes: ["period_count"],
    });

    const period_count = schoolDetails?.period_count || 7;

    const timetables = await Timetable.findAll({
      where: { school_id, class_id },
      attributes: [
        "id",
        "class_id",
        "subject_id",
        "staff_id",
        "day_of_week",
        "period_number",
      ],
      include: [
        {
          model: Class,
          attributes: ["id", "classname"],
        },
        {
          model: Subject,
          attributes: ["subject_name"],
        },
        {
          model: User,
          attributes: ["id", "name", "trash"],
        },
      ],
      order: [
        ["day_of_week", "ASC"],
        ["period_number", "ASC"],
      ],
    });

    res.status(200).json({
      totalcontent: timetables.length,
      period_count,
      timetables,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching timetable:",
      error,
    );
    console.error("Error fetching timetable:", error);
    res.status(500).json({ error: "Failed to fetch timetable" });
  }
};

const getTimetablesConflicts = async (req, res) => {
  try {
    const school_id = req.user.school_id;

    // const schoolDetails = await School.findOne({
    //   where: { id: school_id },
    //   attributes: ["period_count"],
    // });

    // const period_count = schoolDetails?.period_count || 7;

    const timetables = await Timetable.findAll({
      where: { school_id },
      attributes: [
        "id",
        "class_id",
        "subject_id",
        "staff_id",
        "day_of_week",
        "period_number",
      ],
      include: [
        {
          model: Class,
          attributes: ["id", "classname"],
        },
        {
          model: Subject,
          attributes: ["subject_name"],
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
      order: [
        ["day_of_week", "ASC"],
        ["period_number", "ASC"],
      ],
    });

    // ---- 🔍 Conflict Check Logic ----
    const conflictMap = {};
    const conflicts = [];

    for (const entry of timetables) {
      const key = `${entry.staff_id}-${entry.day_of_week}-${entry.period_number}`;

      if (!conflictMap[key]) {
        conflictMap[key] = [];
      }

      conflictMap[key].push(entry);
    }

    // Collect conflicts (same staff, same day, same period)
    for (const key in conflictMap) {
      if (conflictMap[key].length > 1) {
        conflicts.push({
          day_of_week: conflictMap[key][0].day_of_week,
          period_number: conflictMap[key][0].period_number,
          staff_id: conflictMap[key][0].staff_id,
          staff_name: conflictMap[key][0].User?.name || "Unknown",
          classes: conflictMap[key].map((c) => ({
            class_id: c.class_id,
            classname: c.Class?.classname,
            subject_name: c.Subject?.subject_name,
          })),
        });
      }
    }

    res.status(200).json({
      totalcontent: conflicts.length,
      // period_count,
      conflicts,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching timetable:",
      error,
    );
    console.error("Error fetching timetable:", error);
    res.status(500).json({ error: "Failed to fetch timetable" });
  }
};
const getTimetableByTeacherId = async (req, res) => {
  try {
    const teacherId = req.params.teacher_id;
    const school_id = req.user.school_id;
    const day_of_week = req.query.day_of_week;
    if (!teacherId || !school_id || !day_of_week) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const timetables = await Timetable.findAll({
      where: { staff_id: teacherId, school_id, day_of_week },
      order: [
        ["day_of_week", "ASC"],
        ["period_number", "ASC"],
      ],
      include: [
        { model: Subject, attributes: ["id", "subject_name"] }, // optional
        { model: Class, attributes: ["id", "classname"] }, // optional
      ],
    });
    res.json(timetables);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching timetable:",
      error,
    );
    console.error("Error fetching timetable:", error);
    res.status(500).json({ error: "Failed to fetch timetable" });
  }
};
const getAllTeacherLeaveRequestsforSubstitution = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const SchoolDetails = await School.findOne({
      where: { id: school_id },
      attributes: ["period_count"],
    });
    const periodCount = SchoolDetails.period_count;
    const whereClause = {
      trash: false,
      school_id,
      role: "teacher",
      status: "approved", // 👈 only teachers
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

    const { count, rows: leaveRequests } = await LeaveRequest.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,

      attributes: [
        "id",
        "from_date",
        "to_date",
        "reason",
        "status",
        "user_id",
        "half_section",
        "leave_duration",
      ],
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp"],
        },
      ],
      order: [["updatedAt", "DESC"],["from_date", "ASC"]],
    });

    const leaveRequestsWithExtraData = await Promise.all(
      leaveRequests.map(async (leave) => {
        const fromDate = new Date(leave.from_date);
        const toDate = new Date(leave.to_date || leave.from_date);

        // Get all day numbers (0 = Sun → 6 = Sat)
        const dayNumbers = [];
        let tempDate = new Date(fromDate);
        while (tempDate <= toDate) {
          dayNumbers.push(tempDate.getDay());
          tempDate.setDate(tempDate.getDate() + 1);
        }

        // Determine timetable filters
        let periodFilter = {}; // default all periods
        const halfSection = leave.half_section?.toLowerCase();
        const leaveDuration = leave.leave_duration?.toLowerCase();

        if (leaveDuration === "half") {
          const halfPoint = Math.ceil(periodCount / 2);
          if (halfSection === "forenoon") {
            periodFilter = { period_number: { [Op.lte]: halfPoint } };
          } else if (halfSection === "afternoon") {
            periodFilter = { period_number: { [Op.gt]: halfPoint } };
          }
        }
        // ✅ Get timetables assigned to teacher considering half-day rules
        const timetables = await Timetable.findAll({
          where: {
            school_id,
            staff_id: leave.user_id,
            day_of_week: { [Op.in]: dayNumbers },
            ...periodFilter, // 👈 added filter for period_number
          },
          attributes: ["id", "day_of_week", "period_number"],
        });

        const timetablesWithSubs = await Promise.all(
          timetables.map(async (t) => {
            const substitutionCount = await TimetableSubstitution.count({
              where: {
                school_id,
                timetable_id: t.id,
                date: { [Op.between]: [fromDate, toDate] },
              },
            });
            return {
              timetable_id: t.id,
              substitution_count: substitutionCount,
            };
          }),
        );

        const totalSubstituted = timetablesWithSubs.reduce(
          (sum, t) => sum + t.substitution_count,
          0,
        );

        return {
          ...leave.toJSON(),
          total_timetables_assigned: timetables.length,
          substituted_count: totalSubstituted,
          // timetables_with_subs: timetablesWithSubs,
        };
      }),
    );

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      leaveRequests: leaveRequestsWithExtraData,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Fetch All Teacher Leave Requests Error:",
      error,
    );
    console.error("Fetch All Teacher Leave Requests Error:", error);
    res.status(500).json({ error: "Failed to fetch teacher leave requests" });
  }
};
const getPeriodsForleaveRequestedTeacher = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const leaveRequestId = req.params.leaveRequest_id;

    const leave = await LeaveRequest.findOne({
      where: { id: leaveRequestId, school_id },
      attributes: [
        "id",
        "from_date",
        "to_date",
        "reason",
        "status",
        "user_id",
        "half_section",
        "leave_duration",
      ],
      include: [
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
    });

    if (!leave) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    const teacherId = leave.user_id;

    const school = await School.findOne({
      where: { id: school_id },
      attributes: ["period_count"],
    });
    const periodCount = school?.period_count || 7;

    const fromDate = new Date(leave.from_date);
    const toDate = new Date(leave.to_date || leave.from_date);
    const dateList = [];
    let tempDate = new Date(fromDate);
    while (tempDate <= toDate) {
      dateList.push({
        date: new Date(tempDate),
        day_of_week: tempDate.getDay(),
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }

    const dayNumbers = dateList.map((d) => d.day_of_week);
    let periodFilter = {};
    const leaveDuration = leave.leave_duration?.toLowerCase();
    const halfSection = leave.half_section?.toLowerCase();

    if (leaveDuration === "half") {
      const forenoonPeriods = Math.ceil(periodCount / 2 + 0.5);
      const afternoonStart = forenoonPeriods + 1;

      if (halfSection === "forenoon") {
        periodFilter = { period_number: { [Op.lte]: forenoonPeriods } };
      } else if (halfSection === "afternoon") {
        periodFilter = { period_number: { [Op.gte]: afternoonStart } };
      }
    }

    const timetables = await Timetable.findAll({
      where: {
        school_id,
        staff_id: teacherId,
        day_of_week: { [Op.in]: dayNumbers },
        ...periodFilter,
      },
      attributes: [
        "id",
        "day_of_week",
        "period_number",
        "class_id",
        "subject_id",
      ],
      order: [
        ["day_of_week", "ASC"],
        ["period_number", "ASC"],
      ],
      include: [
        { model: Class, attributes: ["id", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
      ],
    });

    const timetablesWithSubs = await Promise.all(
      timetables.map(async (t) => {
        const matchedDates = dateList
          .filter((d) => d.day_of_week === t.day_of_week)
          .map((d) => d.date.toISOString().split("T")[0]);

        const substitutions = await TimetableSubstitution.findAll({
          where: {
            school_id,
            timetable_id: t.id,
            date: { [Op.between]: [fromDate, toDate] },
          },
          attributes: [
            "id",
            "sub_staff_id",
            "date",
            "subject_id",
            "reason",
            "createdAt",
          ],
          include: [
            { model: User, attributes: ["id", "name"] },
            { model: Subject, attributes: ["id", "subject_name"] },
          ],
        });

        return {
          ...t.toJSON(),
          leave_dates: matchedDates,
          substitution_count: substitutions.length,
          substitutions,
        };
      }),
    );

    // 🔹 Response
    res.status(200).json({
      success: true,
      leave_id: leave.id,
      teacher_id: teacherId,
      teacher_name: leave.User.name,
      leave_duration: leave.leave_duration,
      half_section: leave.half_section,
      total_periods: timetablesWithSubs.length,
      timetables: timetablesWithSubs,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching periods with substitutions:",
      error,
    );
    console.error("Error fetching periods with substitutions:", error);
    res.status(500).json({ error: "Failed to fetch periods for teacher" });
  }
};

const getFreeStaffForPeriod = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const now = new Date();
    const day_of_week = req.query.day_of_week || now.getDay();
    const period_number = req.query.period_number || 1;
    const searchQuery = req.query.q || "";
    const subject_id = req.query.subject_id || null;

    if (!period_number) {
      return res.status(400).json({
        error: " period_number is required",
      });
    }
    let whereClause = {
      school_id,
      role: "teacher",
      trash: false,
    };

    if (searchQuery) {
      whereClause[Op.or] = [{ name: { [Op.like]: `%${searchQuery}%` } }];
    }
    if (subject_id) {
      whereClause["$Staff.StaffSubjects.subject_id$"] = subject_id;
    }
    const allStaff = await User.findAll({
      where: whereClause,
      attributes: ["id", "name", "dp"],
      include: [
        {
          model: Staff,
          attributes: ["id", "class_id"],
          include: [
            {
              model: StaffSubject,
              attributes: ["subject_id"],
              include: [{ model: Subject, attributes: ["subject_name"] }],
            },
          ],
        },
      ],
    });

    const assigned = await Timetable.findAll({
      where: {
        school_id,
        day_of_week,
        period_number,
      },
      attributes: ["staff_id"],
    });

    const assignedIds = assigned.map((a) => a.staff_id);
    const freeStaff = allStaff.filter(
      (staff) => !assignedIds.includes(staff.id),
    );
    return res.json({
      school_id,
      day_of_week,
      period_number,
      freeStaff,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getFreeStaffForPeriod error:", error);
    console.error("getFreeStaffForPeriod error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const createSubstitution = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { timetable_id, sub_staff_id, date, subject_id, reason } = req.body;

    if (!school_id || !timetable_id || !sub_staff_id || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const timetable = await Timetable.findOne({
      where: { id: timetable_id, school_id },
    });
    if (!timetable) {
      return res.status(404).json({ error: "Timetable not found" });
    }
    const existingTimetable = await Timetable.findOne({
      where: {
        staff_id: sub_staff_id,
        day_of_week: timetable.day_of_week,
        period_number: timetable.period_number,
        school_id,
      },
    });
    if (existingTimetable) {
      return res.status(400).json({
        error:
          "Substitute staff is already assigned to another class at this period",
      });
    }

    const existingSub = await TimetableSubstitution.findOne({
      where: {
        school_id,
        timetable_id,
        date,
      },
    });
    if (existingSub) {
      return res.status(400).json({
        error: "Substitution already exists for this date and timetableId",
      });
    }

    const substitution = await TimetableSubstitution.create({
      school_id,
      timetable_id,
      sub_staff_id,
      date,
      subject_id,
      reason,
    });

    res.status(201).json(substitution);
  } catch (error) {
    console.error("Error creating substitution:", error);
    res.status(500).json({ error: error.message });
  }
};
const bulkCreateSubstitution = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { substitutions } = req.body;

    if (
      !school_id ||
      !Array.isArray(substitutions) ||
      substitutions.length === 0
    ) {
      return res.status(400).json({
        error: "Missing required fields or empty substitutions array",
      });
    }

    const results = [];
    const errors = [];

    for (const sub of substitutions) {
      const { timetable_id, sub_staff_id, date, subject_id, reason } = sub;

      if (!timetable_id || !sub_staff_id || !date) {
        errors.push({ sub, error: "Missing required fields" });
        continue;
      }

      const timetable = await Timetable.findOne({
        where: { id: timetable_id, school_id },
      });
      if (!timetable) {
        errors.push({ sub, error: "Timetable not found" });
        continue;
      }

      const existingTimetable = await Timetable.findOne({
        where: {
          staff_id: sub_staff_id,
          day_of_week: timetable.day_of_week,
          period_number: timetable.period_number,
          school_id,
        },
      });
      if (existingTimetable) {
        errors.push({
          sub,
          error:
            "Substitute staff is already assigned to another class at this period",
        });
        continue;
      }

      const existingSub = await TimetableSubstitution.findOne({
        where: {
          school_id,
          timetable_id,
          date,
        },
      });
      if (existingSub) {
        errors.push({
          sub,
          error: "Substitution already exists for this date and timetableId",
        });
        continue;
      }

      results.push({
        school_id,
        timetable_id,
        sub_staff_id,
        date,
        subject_id,
        reason,
      });
    }

    let createdSubs = [];
    if (results.length > 0) {
      createdSubs = await TimetableSubstitution.bulkCreate(results);
    }

    res.status(201).json({
      success: true,
      created: createdSubs,
      failed: errors,
    });
  } catch (error) {
    console.error("Error bulk creating substitutions:", error);
    res.status(500).json({ error: error.message });
  }
};
const getAllSubstitutions = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const date = req.query;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {
      school_id,
    };
    if (date) {
      whereClause.date = date;
    }

    const { count, rows: subs } = await TimetableSubstitution.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Timetable,
          attributes: ["id", "day_of_week", "period_number"],
          required: false,
          include: [
            {
              model: Class,
              attributes: ["id", "classname"],
            },
          ],
        },
        { model: User, attributes: ["id", "name"] },
        { model: Subject, attributes: ["id", "subject_name"] },
      ],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: subs.count,
      totalPages,
      currentPage: page,
      subs: subs,
    });
  } catch (error) {
    console.error("Error fetching substitutions:", error);
    res.status(500).json({ error: error.message });
  }
};
const getSubstitutionById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const substitution = await TimetableSubstitution.findOne({
      where: { id, school_id },
      include: [
        {
          model: Timetable,
          attributes: ["id", "day_of_week", "period_number"],
          required: false,
          include: [
            {
              model: Class,
              attributes: ["id", "classname"],
            },
          ],
        },
        { model: User, attributes: ["id", "name"] },
        { model: Subject, attributes: ["id", "subject_name"] },
      ],
    });

    if (!substitution) {
      return res.status(404).json({ error: "Substitution not found" });
    }
    res.json(substitution);
  } catch (error) {
    console.error("Error fetching substitution:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateSubstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const { sub_staff_id, subject_id, reason } = req.body;
    if (!id || !sub_staff_id || !subject_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const substitution = await TimetableSubstitution.findOne({
      where: { id, school_id },
    });
    if (!substitution) {
      return res.status(404).json({ error: "Substitution not found" });
    }

    const updated = await TimetableSubstitution.update(
      { sub_staff_id, subject_id, reason },
      {
        where: { id },
      },
    );
    res.json({ message: "Substitution updated", updated });
  } catch (error) {
    console.error("Error updating substitution:", error);
    res.status(500).json({ error: error.message });
    console.log(error);
  }
};

const deleteSubstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const substitution = await TimetableSubstitution.findOne({
      where: { id, school_id },
    });
    if (!substitution) {
      return res.status(404).json({ error: "Substitution not found" });
    }
    await TimetableSubstitution.destroy({ where: { id } });
    res.json({ message: "Substitution deleted" });
  } catch (error) {
    console.error("Error deleting substitution:", error);
    res.status(500).json({ error: error.message });
  }
};
const getSchoolAttendanceSummary = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const attendanceMarkingCount = await School.findOne({
      where: { id: school_id },
      attributes: ["attendance_count"],
    });
    const date = req.query.date || new Date().toISOString().split("T")[0];
    if (!school_id || !date) {
      return res.status(400).json({ error: "school_id and date are required" });
    }

    const records = await Attendance.findAll({
      where: { school_id, date, trash: false },
      attributes: ["id", "class_id", "period", "date"],
      include: [
        {
          model: AttendanceMarked,
          attributes: ["status"],
        },
        {
          model: Class,
          attributes: ["id", "classname"],
        },
      ],
      order: [
        ["class_id", "ASC"],
        ["period", "ASC"],
      ],
    });

    const classSummary = {};
    for (const rec of records) {
      const classId = rec.class_id;
      const studentCount = await Student.count({
        where: {
          class_id: classId,
          school_id,
          trash: false,
        },
      });
      if (!classSummary[classId]) {
        classSummary[classId] = {
          class_id: classId,
          classname: rec.Class?.classname || "Unknown",
          date: rec.date,
          periods: [],
          classTotals: studentCount,
        };
      }

      const presentCount = rec.AttendanceMarkeds.filter(
        (m) => m.status === "present",
      ).length;
      classSummary[classId].periods.push({
        period: rec.period,
        present: presentCount,
      });
    }

    res.json({
      attendanceMarkingCount: attendanceMarkingCount.attendance_count,
      classSummary: Object.values(classSummary),
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error in getSchoolAttendanceSummary:",
      error,
    );
    console.error("Error in getSchoolAttendanceSummary:", error);
    res.status(500).json({ error: error.message });
  }
};
const getNavigationBarCounts = async (req, res) => {
  try {
    const school_id = req.user.school_id;

    const teacherLeaveRequestCount = await LeaveRequest.count({
      where: {
        school_id,
        role: "teacher",
        status: "pending",
        trash: false,
      },
    });

    const staffLeaveRequestCount = await LeaveRequest.count({
      where: {
        school_id,
        role: "staff",
        status: "pending",
        trash: false,
      },
    });

    const studentLeaveRequestCount = await LeaveRequest.count({
      where: {
        school_id,
        role: "student",
        status: "pending",
        trash: false,
      },
    });

    res.json({
      teacherLeaveRequestCount,
      staffLeaveRequestCount,
      studentLeaveRequestCount,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching pending leave request counts by role:",
      error,
    );
    console.error(
      "Error fetching pending leave request counts by role:",
      error,
    );
    res
      .status(500)
      .json({ error: "Failed to fetch pending leave request counts" });
  }
};

const dashboardCounts = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const startDate = req.query.startDate || moment().startOf("day").toDate();
    const endDate = req.query.endDate || moment().endOf("day").toDate();

    const totalStudents = await Student.count({
      where: { school_id, trash: false, alumni: false },
    });

    const totalTeachers = await Staff.count({
      where: { school_id, role: "teacher", trash: false },
    });
    const totalStaff = await Staff.count({
      where: { school_id, role: "staff", trash: false },
    });
    const totalClasses = await Class.count({
      where: { school_id, trash: false },
    });
    const totalSubjects = await Subject.count({
      where: { school_id, trash: false },
    });
    const upcomingEvents = await Event.count({
      where: {
        school_id,
        date: { [Op.gte]: startDate },
        trash: false,
      },
    });

    const pendingTeacherLeaves = await LeaveRequest.count({
      where: {
        school_id,
        role: "teacher",
        status: "pending",
        trash: false,
      },
    });
    const pendingStaffLeaves = await LeaveRequest.count({
      where: {
        school_id,
        role: "staff",
        status: "pending",
        trash: false,
      },
    });

    const pendingStudentLeaves = await LeaveRequest.count({
      where: {
        school_id,
        role: "student",
        status: "pending",
        trash: false,
      },
    });
    const teachersLeave = await LeaveRequest.count({
      where: {
        school_id,
        role: "teacher",
        status: "approved",
        from_date: { [Op.lte]: startDate },
        to_date: { [Op.gte]: endDate },
        trash: false,
      },
    });
    const staffsLeave = await LeaveRequest.count({
      where: {
        school_id,
        role: "staff",
        status: "approved",
        from_date: { [Op.lte]: startDate },
        to_date: { [Op.gte]: endDate },
        trash: false,
      },
    });

    const studentsLeave = await LeaveRequest.count({
      where: {
        school_id,
        role: "student",
        status: "approved",
        from_date: { [Op.lte]: startDate },
        to_date: { [Op.gte]: endDate },
        trash: false,
      },
    });

    const attendanceStatusCounts = await AttendanceMarked.findAll({
      attributes: [
        "status",
        [schoolSequelize.fn("COUNT", schoolSequelize.col("status")), "count"],
      ],
      include: [
        {
          model: Attendance,
          where: {
            school_id,
            date: {
              [Op.between]: [startDate, endDate],
            },
            period: 1,
            trash: false,
          },
          attributes: [],
        },
      ],
      group: ["status"],
      raw: true,
    });

    const studentsAttendance = {
      present: 0,
      absent: 0,
      late: 0,
    };

    attendanceStatusCounts.forEach((row) => {
      if (studentsAttendance.hasOwnProperty(row.status)) {
        studentsAttendance[row.status] = parseInt(row.count, 10);
      }
    });
    const homeworkCount = await Homework.count({
      where: {
        school_id,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        trash: false,
      },
    });

    const internalMarkCount = await InternalMark.count({
      where: {
        school_id,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const achievementCount = await Achievement.count({
      where: {
        school_id,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        trash: false,
      },
    });
    const paymentsCount = await Payment.count({
      where: {
        school_id,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        trash: false,
      },
    });
    const newsCount = await News.count({
      where: {
        school_id,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        trash: false,
      },
    });
    const noticeCount = await Notice.count({
      where: {
        school_id,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        trash: false,
      },
    });

    res.status(200).json({
      totalStudents,
      totalTeachers,
      totalStaff,
      totalClasses,
      totalSubjects,
      upcomingEvents,
      pendingTeacherLeaves,
      pendingStaffLeaves,
      pendingStudentLeaves,
      teachersLeave,
      staffsLeave,
      studentsLeave,
      studentsAttendance,
      homeworkCount,
      internalMarkCount,
      achievementCount,
      paymentsCount,
      newsCount,
      noticeCount,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "DashbordCounts error:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getAllInternalMarks = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.query.class_id || null;
    const subject_id = req.query.subject_id || null;
    const teacher_id = req.query.teacher_id || null;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {
      school_id,
      trash: false,
      exam_id:null,
    };
    if (class_id) {
      whereClause.class_id = class_id;
    }
    if (subject_id) {
      whereClause.subject_id = subject_id;
    }
    if (teacher_id) {
      whereClause.recorded_by = teacher_id;
    }
    if(searchQuery){
      whereClause[Op.or] = [
        { internal_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: marks } = await InternalMark.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        { model: School, attributes: ["id", "name"] },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
        { model: User, attributes: ["name"] },
        { model: Exam, attributes: ["id", "exam_name", "education_year"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      marks,
    });
    // res.status(200).json(marks);
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error fetching marks:", error);
    console.error("Error fetching marks:", error);
    res.status(500).json({ error: "Failed to fetch marks" });
  }
};
const getAllTermExams = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.query.class_id || null;
    const subject_id = req.query.subject_id || null;
    const teacher_id = req.query.teacher_id || null;
    const exam_id = req.query.exam_id || null;
    const internal_name = req.query.internal_name || null;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {
      school_id,
      trash: false,
      exam_id:{[Op.ne]:null},
    };
    if (class_id) {
      whereClause.class_id = class_id;
    }
    if (subject_id) {
      whereClause.subject_id = subject_id;
    }
    if (teacher_id) {
      whereClause.recorded_by = teacher_id;
    }
    if(exam_id){
      whereClause.exam_id = exam_id;
    }
    if(internal_name){
      whereClause.internal_name = internal_name;
    }
    if(searchQuery){
      whereClause[Op.or] = [
        { internal_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: marks } = await InternalMark.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        { model: School, attributes: ["id", "name"] },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
        { model: User, attributes: ["name"] },
        { model: Exam, attributes: ["id", "exam_name", "education_year"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      marks,
    });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error fetching marks:", error);
    console.error("Error fetching marks:", error);
    res.status(500).json({ error: "Failed to fetch marks" });
  }
};
const getInternalmarkById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { id } = req.params;
    const internalmark = await InternalMark.findOne({
      attributes: ["id", "internal_name", "max_marks", "date", "exam_id","subject_id","recorded_by"],
      where: { id, school_id },
      include: [
        { model: Class, attributes: ["classname"] },
        { model: Subject, attributes: ["subject_name"] },
        { model: User, attributes: ["name"] },
        { model:Exam,attributes:["exam_name"]},
        {
          model: Marks,
          attributes: ["marks_obtained", "status"],
          include: [
            { model: Student, attributes: ["full_name", "roll_number"] },
          ],
        },
      ],
    });
    if (!internalmark) {
      return res.status(404).json({ error: "Internal mark not found" });
    }
    res.status(200).json(internalmark);
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error in getInternalmarkById:", error);
    res.status(500).json({ error: error.message });
  }
};
const updateInternalMark = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const{
      exam_id,
      subject_id,
      internal_name,
      date,
      teacher_id
    } = req.body;
    const existingExam = await InternalMark.findOne({ where: { id, school_id } });

    if (!existingExam) {
      return res.status(404).json({ error: "Internal mark not found" });
    }

    let subjectIdToUpdate = subject_id;
    if(subject_id===0 || !subject_id){
      subjectIdToUpdate = existingExam.subject_id;
    }
     const existingWhere = {
        id: { [Op.ne]: id },
        school_id,
        class_id: existingExam.class_id,
        subject_id:subjectIdToUpdate,
        internal_name:internal_name ? internal_name : existingExam.internal_name,
      };
  
      if (exam_id !== null && exam_id !== undefined && exam_id !== "") {
        existingWhere.exam_id = exam_id ? exam_id : existingExam.exam_id;
      } else {
        existingWhere.date = date ? date : existingExam.date;
      }
  
      const existingInternal = await InternalMark.findOne({
        where: existingWhere,
      });
      if (existingInternal) {
        return res.status(400).json({ error: "Internal mark already exists" });
      }
    const updated = await InternalMark.update(
      {
        subject_id: subjectIdToUpdate,
        internal_name,
        date,
        exam_id,
        recorded_by:teacher_id ? teacher_id : existingExam.recorded_by
      },
      {
      where: { id: id },
    });

    res.status(200).json({ message: "Exam detail updated", updated });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error updating exam detail:",
      error,
    );
    
    res.status(500).json({ error: "Update failed" });
  }
};
const deleteInternalMark = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const internalMark = await InternalMark.findOne({
      where: { id,  trash: false ,school_id,},
    })
    if (!internalMark) {
      return res.status(404).json({ error: "Internal mark not found" });
    }
    await InternalMark.update({ trash: true }, { where: { id: id } });
    res.status(200).json({ message: "Exam soft-deleted" });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error deleting exam:", error);
    res.status(500).json({ error: "Delete failed" });
  }
};
const restoreInternalMark = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const internalMark = await InternalMark.findOne({
      where: { id, school_id, trash: true },
    });
    if (!internalMark) {
      return res.status(404).json({ error: "Internal Mark not found" });
    }
    await internalMark.update({ trash: false });
    res.status(200).json({ message: "Internal Mark restored successfully" });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error restoring internal mark:", error);
    console.error("Error restoring internal mark:", error);
    res.status(500).json({ error: "Failed to restore internal mark" });
  }
};
const permanentDeleteInternalMark = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const internalMark = await InternalMark.findOne({
      where: { id, school_id, trash: true },
    });
    if (!internalMark) {
      return res.status(404).json({ error: "Internal Mark not found" });
    }
    await Marks.destroy({ where: { internal_id: id } });
    await internalMark.destroy();

    res.status(200).json({ message: "Internal Mark permanently deleted" });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error permanently deleting internal mark:", error);
    console.error("Error permanently deleting internal mark:", error);
    res.status(500).json({ error: "Failed to permanently delete internal mark" });
  }
};
const getTrashedInternalMarks = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.query.class_id || null;
    const subject_id = req.query.subject_id || null;
    const teacher_id = req.query.teacher_id || null;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {
      school_id,
      trash: true,
      exam_id:null,
    };
    if (class_id) {
      whereClause.class_id = class_id;
    }
    if (subject_id) {
      whereClause.subject_id = subject_id;
    }
    if (teacher_id) {
      whereClause.recorded_by = teacher_id;
    }
    if(searchQuery){
      whereClause[Op.or] = [
        { internal_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: marks } = await InternalMark.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        { model: School, attributes: ["id", "name"] },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
        { model: User, attributes: ["name"] },
        { model: Exam, attributes: ["id", "exam_name", "education_year"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      marks,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching trashed internal marks:",
      error,
    );
    console.error("Error fetching trashed internal marks:", error);
    res.status(500).json({ error: "Failed to fetch trashed internal marks" });
  }
};
const getTrashedTermExams = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.query.class_id || null;
    const subject_id = req.query.subject_id || null;
    const teacher_id = req.query.teacher_id || null;
    const exam_id = req.query.exam_id || null;
    const internal_name = req.query.internal_name || null;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {
      school_id,
      trash: true,
      exam_id:{[Op.ne]:null},
    };
    if (class_id) {
      whereClause.class_id = class_id;
    }
    if (subject_id) {
      whereClause.subject_id = subject_id;
    }
    if (teacher_id) {
      whereClause.recorded_by = teacher_id;
    }
    if(exam_id){
      whereClause.exam_id = exam_id;
    }
    if(internal_name){
      whereClause.internal_name = internal_name;
    }
    if(searchQuery){
      whereClause[Op.or] = [
        { internal_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: marks } = await InternalMark.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        { model: School, attributes: ["id", "name"] },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
        { model: User, attributes: ["name"] },
        { model: Exam, attributes: ["id", "exam_name", "education_year"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      marks,
    });
    // res.status(200).json(marks);
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error fetching marks:", error);
    console.error("Error fetching marks:", error);
    res.status(500).json({ error: "Failed to fetch marks" });
  }
};
const getHomeworkById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const homework = await Homework.findOne({
      attributes: ["id", "title", "description", "due_date", "file"],
      where: { id, trash: false, school_id },
      include: [
        { model: Class, attributes: ["id", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
        { model: User, attributes: ["id", "name"] },
        {
          model: HomeworkAssignment,
          attributes: ["id", "points", "remarks"],
          include: [
            { model: Student, attributes: ["id", "full_name", "roll_number"] },
          ],
        },
      ],
    });

    if (!homework) return res.status(404).json({ error: "Not found" });

    const pointCounts = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    const assignments = homework.HomeworkAssignments || [];

    assignments.forEach((record) => {
      const point = record.points;
      if (point && pointCounts.hasOwnProperty(point)) {
        pointCounts[point]++;
      }
    });

    const total_students = assignments.length;

    const response = {
      summary: {
        total_students,
        ...pointCounts,
      },
      ...homework.toJSON(),
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error in getHomeworkById:", error);
    res.status(500).json({ error: error.message });
  }
};
const updateHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const teacher_id = req.user.user_id;
    const { title, description,due_date,subject_id } = req.body;
    const homework = await Homework.findOne({
      where: { id: id, school_id: school_id, teacher_id: teacher_id },
    });
    if (!homework) return res.status(404).json({ error: "Not found" });
    const existingHomework = await Homework.findOne({
      where: {
        id: { [Op.ne]: id },
        school_id ,
        teacher_id,
        class_id: homework.class_id,
        subject_id,
        title,
        due_date:due_date,
        trash: false,
      },
    });
    if (existingHomework) {
      return res.status(200).json({
        message: "Homework already exists in the same class",
        homework: existingHomework,
      });
    }

    let finalFile = homework.file;
    const newFileUrl = req.uploadedFiles?.file?.url || null;
    if (newFileUrl) {
      if (homework.file) {
        await deleteFile(homework.file);
      }

      finalFile = newFileUrl;
    }

    await homework.update({
      title,
      description,
      subject_id,
      due_date,
      file: finalFile,
    });
    res.status(200).json({ message: "Updated successfully d", homework });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error updating homework:", error);
    res.status(500).json({ error: error.message });
  }
};
const deleteHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const homework = await Homework.findOne({
      where: { id: id, school_id,trash:false },
    });
    if (!homework)
      return res.status(404).json({ error: "Not found" });

    await Homework.update({ trash: true }, { where: { id: id } });
    res.status(200).json({
      message: `Deleted successfully,'description : ${homework.title}'.`,
    });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error deleting homework:", error);
    res.status(500).json({ error: "Delete failed" });
  }
};
const permanentDeleteHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const homework = await Homework.findOne({
      where: { id: id, school_id: school_id ,trash: true},
    });
    if (!homework) return res.status(404).json({ error: "Not found" });
    const homeworkAssignments = await HomeworkAssignment.findAll({
      where: { homework_id: id },
    })
    for (const assignment of homeworkAssignments) {
      if(assignment.solved_file){
        await deleteFile(assignment.solved_file);
      }
    }

    await HomeworkAssignment.destroy({ where: { homework_id: id } });
    if(homework.file){
      await deleteFile(homework.file);
    }
    await homework.destroy();

    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error permanently deleting homework:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const restoreHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const homework = await Homework.findOne({
      where: { id: id, school_id, trash: true},
    });
    if (!homework) return res.status(404).json({ error: "Not found" });

    await Homework.update({ trash: false }, { where: { id: id } });

    res.json({
      message: `restored 'description : ${homework.description}'`,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error restoring homework:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getTrashedHomework = async (req, res) => {
  try {
   const school_id = req.user.school_id;
    const class_id = req.query.class_id || "";
    const teacher_id = req.query.teacher_id || "";
    const subject_id = req.query.subject_id || "";
    const searchQuery = req.query.q || "";
    const start_date = req.query.start_date || "";
    const end_date = req.query.end_date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = page && limit ? (page - 1) * limit : 0;

    let whereClause = {
      trash: true,
      school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (class_id) {
      whereClause.class_id = class_id;
    }
    if (subject_id) {
      whereClause.subject_id = subject_id;
    }
    if (teacher_id) {
      whereClause.teacher_id = teacher_id;
    }
    if (start_date) {
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.gte]: new Date(startDate),
      };
    }
    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(endDate),
      };
    }
    const totalCount = await Homework.count({ where: whereClause });
    const homeworks = await Homework.findAll({
      where: whereClause,
      offset,
      limit,
      include: [
        { model: Class, attributes: ["id", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
        { model: User, attributes: ["id", "name"] },
        {
          model: HomeworkAssignment,
          attributes: ["id", "student_id", "points"],
          include: [{ model: Student, attributes: ["id", "full_name"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalPages = limit ? Math.ceil(totalCount / limit) : 1;
    res.status(200).json({
      totalcontent: totalCount,
      totalPages,
      currentPage: page,
      homeworks,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching trashed homework:",
      error,
    );  
  console.error("Error fetching trashed homework:", error);
    res.status(500).json({ error: "Failed to fetch trashed homework" });
  }
};
  


const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const attendance = await Attendance.findOne({
      attributes: ["id", "period", "date"],
      where: { id, school_id, trash: false },
      include: [
        { model: Class, attributes: ["id", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
        { model: User, attributes: ["id", "name"] },
        {
          model: AttendanceMarked,
          attributes: ["id", "status", "remarks"],
          include: [
            { model: Student, attributes: ["id", "full_name", "roll_number"] },
          ],
        },
      ],
    });

    if (!attendance) return res.status(404).json({ error: "Not found" });

    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
    };

    const marked = attendance.AttendanceMarkeds || [];

    marked.forEach((record) => {
      const status = record.status?.toLowerCase();
      if (status && counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });

    const total_students = marked.length;

    const response = {
      summary: {
        total_students,
        ...counts,
      },
      ...attendance.toJSON(),
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error in getAttendanceById:", error);
    console.error("Error in getAttendanceById:", error);
    res.status(500).json({ error: error.message });
  }
};

const createStaffAttendance = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { staff_id, date, status, check_in_time, check_out_time, remarks } =
      req.body;
    //role teacher or staff check
    const staff = await User.findOne({
      where: {
        id: staff_id,
        school_id,
        trash: false,
        role: { [Op.in]: ["teacher", "staff"] },
      },
    });
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }
    const existing = await StaffAttendance.findOne({
      where: { school_id, staff_id, date, trash: false },
    });

    if (existing)
      return res
        .status(400)
        .json({ message: "Attendance already exists for this date" });

    let total_hours = null;
    if (check_in_time && check_out_time) {
      const diff =
        (new Date(check_out_time) - new Date(check_in_time)) / (1000 * 60 * 60);
      total_hours = diff.toFixed(2);
    }

    const attendance = await StaffAttendance.create({
      school_id,
      staff_id,
      date,
      status,
      check_in_time:
        check_in_time || status === "Present"
          ? new Date().toISOString()
          : null,
      check_out_time: check_out_time || null,
      total_hours,
      marked_by: staff_id,
      marked_method: "Manual",
      remarks,
    });

    res.status(201).json({
      message: "Attendance added successfully",
      attendance,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error adding attendance:", error);
    console.error("Error adding attendance:", error);
    res.status(500).json({ error: "Failed to add attendance" });
  }
};
const updateStaffAttendance = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { id } = req.params;
    const { status, check_in_time, check_out_time, remarks } = req.body;
    const attendance = await StaffAttendance.findOne({
      where: { id, school_id, trash: false },
    });
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });

    let total_hours = attendance.total_hours;
    if (check_in_time && check_out_time) {
      const diff =
        (new Date(check_out_time) - new Date(check_in_time)) / (1000 * 60 * 60);
      total_hours = diff.toFixed(2);
    }
    await attendance.update({
      status: status || attendance.status,
      check_in_time:
        check_in_time ||
        attendance.check_in_time ||
        check_in_time ||
        status === "present"
          ? new Date().toISOString()
          : null,
      check_out_time: check_out_time || attendance.check_out_time,
      total_hours,
      remarks: remarks || attendance.remarks,
    });

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating attendance:",
      error,
    );
    console.error("Error updating attendance:", error);
    res.status(500).json({ error: "Failed to update attendance" });
  }
};
const getAllStaffAttendance = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const staff_id = req.query.staff_id;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;
    const role = req.query.role || "";
    const download = req.query.download || "";
    const searchQuery = req.query.q || "";
    let { page = 1, limit = 10 } = req.query;
    if (download === "true") {
      page = null;
      limit = null;
    } else {
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
    }

    const offset = page && limit ? (page - 1) * limit : 0;

    const whereClause = { school_id, trash: false };
    if (staff_id) whereClause.staff_id = staff_id;
    if (start_date && end_date) {
      whereClause.date = { [Op.between]: [start_date, end_date] };
    }

    let userWhere = {trash: false, school_id};
    if (searchQuery) {
      userWhere.name = { [Op.like]: `%${searchQuery}%` };
    }
    if (role) {
      userWhere.role = role;
    }

    const count = await StaffAttendance.count({
      where: whereClause,
      include: [
        {
          model: User,
          where: userWhere,
          required: true,
        },
      ],
      distinct: true,
    });
    const records = await StaffAttendance.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          where: userWhere,
          attributes: ["id", "name", "role","dp"],
          required: true,
        },
      ],
      order: [["date", "DESC"]],
      offset,
      limit,
    });
    const totalPages = limit ? Math.ceil(count / limit) : null;

    res.status(200).json({
      totalCount: count,
      totalPages: download === "true" ? null : totalPages,
      currentPage: download === "true" ? null : page,
      attendance: records,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching attendance:",
      error,
    );
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
};
const getStaffAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const attendance = await StaffAttendance.findOne({
      where: { id, school_id, trash: false },
    });
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });
    res.status(200).json(attendance);
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching attendance:",
      error,
    );
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
};

const getStaffAttendanceByDate = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const role = req.query.role || null;
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const whereClause = {
      role: { [Op.in]: ["teacher", "staff"] },
      school_id,
      trash: false,
    };
    if (role) {
      whereClause.role = role;
    }
    const count = await User.count({ where: whereClause });
    const staffList = await User.findAll({
      where: whereClause,
      attributes: ["id", "name", "email", "phone"],
      include: [
        {
          model: StaffAttendance,
          required: false,
          where: { date, trash: false },
          attributes: [
            "id",
            "status",
            "check_in_time",
            "check_out_time",
            "createdAt",
          ],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.status(200).json({
      total_staff: count,
      date,
      attendance: staffList,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching staff attendance by date:",
      error,
    );
    console.error("Error fetching staff attendance by date:", error);
    res.status(500).json({ error: "Failed to fetch staff attendance by date" });
  }
};
const bulkCreateStaffAttendance = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const admin_id = req.user.user_id;
    const records = req.body.records;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res
        .status(400)
        .json({ message: "No attendance records provided" });
    }

    const processedRecords = [];
    for (const record of records) {
      const { staff_id, date, status, remarks } = record;
      // check the staff id is the same school
      const staff = await User.findOne({
        where: {
          id: staff_id,
          school_id,
          trash: false,
          role: { [Op.in]: ["teacher", "staff"] },
        },
      });
      if (!staff) {
        return res.status(404).json({ error: "Staff not found" });
      }

      const check_in_time =
        record.check_in_time || record.status === "present"
          ? new Date().toISOString()
          : null;
      const check_out_time = record.check_out_time || null;
      if (!staff_id || !date) continue;

      const existing = await StaffAttendance.findOne({
        where: { school_id, staff_id, date, trash: false },
      });
      if (existing) {
        processedRecords.push({
          staff_id,
          school_id,
          date,
          status: "Skipped",
          message: "Attendance already exists for this staff on the date",
        });
        continue;
      }

      let total_hours = null;
      if (check_in_time && check_out_time) {
        const diff =
          (new Date(check_out_time) - new Date(check_in_time)) /
          (1000 * 60 * 60);
        total_hours = diff.toFixed(2);
      }
      const attendanceData = {
        school_id,
        staff_id,
        date,
        status: status || "Present",
        check_in_time:
          check_in_time || status === "present"
            ? new Date().toISOString()
            : null,
        check_out_time,
        total_hours,
        marked_by: admin_id,
        marked_method: "Manual",
        remarks,
      };

      await StaffAttendance.create(attendanceData);
      processedRecords.push({
        staff_id,
        date,
        status: "Added",
        message: "Attendance marked successfully",
      });
    }

    res.status(201).json({
      message: "Bulk attendance processing completed",
      results: processedRecords,
    });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Bulk attendance creation error:",
      error,
    );
    console.error("Bulk attendance creation error:", error);
    res.status(500).json({ error: "Failed to process bulk attendance" });
  }
};
const deleteStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const attendance = await StaffAttendance.findOne({
      where: { id, school_id, trash: false },
    });
    if (!attendance)
      return res.status(404).json({ message: "Attendance not found" });
    await attendance.destroy();
    res.status(200).json({ message: "Attendance deleted successfully" });
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting attendance:",
      error,
    );
    console.error("Error deleting attendance:", error);
    res.status(500).json({ error: "Failed to delete attendance" });
  }
};

//tracker///////////////////////////////////////////////////////////

//create stop✅
const createStop = async (req, res) => {
  try {
    const { route_id, stop_name, priority, latitude, longitude } = req.body;

    if (!route_id || !stop_name) {
      return res.status(400).json({ message: "Fields are missing" });
    }
    const route = await Routes.findOne({
      where: { id: route_id, trash: false },
    });

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const existingStop = await Stop.findOne({
      where: {
        route_id,
        stop_name,
        trash: false,
      },
    });

    if (existingStop) {
      return res.status(404).json({ message: "Stop already exists" });
    }

    const stop = await Stop.create({
      route_id,
      stop_name,
      priority,
      latitude,
      longitude,
      trash: false,
      recorded_by: req.user.user_id,
    });

    res.status(201).json({
      message: "Stop created successfully",
      stop,
    });
  } catch (error) {
    logger.error( "schoolId:",
      req.user.school_id,
      "Error creating stop:", error);
    console.error("Error creating stop:", error);
    res.status(500).json({ error: "Failed to create stop" });
  }
};

const createDriver = async (req, res) => {
  const transaction = await schoolSequelize.transaction();

  try {
    const school_id = req.user.school_id;
    const { name, email, phone, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    if (email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Driver's email already exists" });
      }
    }

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: "Driver's phone already exists" });
    }

    const photoPath = req.uploadedFiles?.photo?.[0]?.url || null;

    const hashedPassword = await bcrypt.hash(phone, 10);

    const user = await User.create(
      {
        name,
        email,
        phone,
        password: hashedPassword,
        school_id,
        role: "driver",
        status: "active",
      },
      { transaction },
    );

    const driver = await Driver.create(
      {
        school_id,
        user_id: user.id,
        name,
        phone,
        email,
        address,
        photo: photoPath,
        trash: false,
      },
      { transaction },
    );

    await transaction.commit();

    res.status(201).json({
      message: "Driver created successfully",
      driver,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("schoolId:", req.user.school_id, "Error creating driver:", error);
    console.error("Error creating driver:", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllDrivers = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const drivers = await User.findAll({
      where: {
        trash: false,
        school_id,
        role: "driver",
      },
      attributes: ["id", "name", "phone", "email","dp"],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Fetched successfully",
      data: drivers,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error fetching drivers:", error);
    console.error("Error fetching drivers:", error);
    return res.status(500).json({
      error: "Failed to fetch drivers",
    });
  }
};

const createVehicle = async (req, res) => {
  try {
    const { type, model, vehicle_number, driver_id } = req.body;
    const school_id = req.user.school_id;

    if (!vehicle_number) {
      return res.status(400).json({ message: "Vehicle number is required" });
    }

    if (driver_id) {
      const driver = await User.findOne({
        where: { id: driver_id, trash: false, school_id, role: "driver" },
      });

      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
    }

    const photoUrl = req.uploadedFiles?.photo?.[0]?.url || null;

    const vehicle = await Vehicle.create({
      type,
      model,
      vehicle_number,
      photo: photoUrl,
      driver_id,
      trash: false,
      school_id: school_id,
    });

    res.status(201).json({
      message: "Vehicle created successfully",
      vehicle,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error creating vehicle:", error);
    console.error("Error creating vehicle:", error);
    res.status(500).json({ error: "Failed to create vehicle" });
  }
};

const getAllVehicles = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const vehicles = await Vehicle.findAll({
      where: { trash: false, school_id: school_id },
      include: [
        {
          model: User,
          as: "driver",
          attributes: ["id", "name", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Vehicles fetched successfully",
      vehicles,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error fetching vehicles:", error);
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const vehicle = await Vehicle.findOne({
      where: { id, trash: false, school_id: school_id },
      include: [
        {
          model: User,
          as: "driver",
          attributes: ["id", "name", "phone"],
        },
      ],
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json({
      message: "Vehicle fetched successfully",
      vehicle,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error fetching vehicle:", error);
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ error: "Failed to fetch vehicle" });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const { type, model, vehicle_number, driver_id } = req.body;

    if (driver_id) {
      const driver = await User.findOne({
        where: { id: driver_id, trash: false, school_id: school_id, role: "driver" },
      });

      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
    }

    const vehicle = await Vehicle.findOne({
      where: { id, trash: false, school_id: school_id },
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const newPhotoUrl = req.uploadedFiles?.photo?.[0]?.url || null;
    let finalPhoto = vehicle.photo;
    if (newPhotoUrl) {
      if (vehicle.photo) {
        await deleteFile(vehicle.photo);
      }
      finalPhoto = newPhotoUrl;
    }

    await vehicle.update({
      type,
      model,
      vehicle_number,
      driver_id,
      photo: finalPhoto,
    });
    res.status(200).json({
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error updating vehicle:", error);
    console.error("Error updating vehicle:", error);
    res.status(500).json({ error: "Failed to update vehicle" });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const vehicle = await Vehicle.findOne({
      where: {
        id,
        trash: false,
        school_id: school_id,
      },
    });

    if (!vehicle) {
      return res.status(404).json({ message: "vehicle not found" });
    }

    await vehicle.update({ trash: true });
    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch {
    logger.error("schoolId:", req.user.school_id, "Error delete vehicle :", error);
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
};

const createRoute = async (req, res) => {
  try {
    const {
      start,
      stop,
      route_no,
      vehicle_id,
      driver_id,
      isLock,
      hasDropRoute,
    } = req.body;
    const school_id = req.user.school_id;

    if (!start || !stop) {
      return res.status(400).json({ message: "start and stop are required" });
    }

    if (!school_id) {
      return res.status(404).json({
        message: "school not found",
      });
    }

    if (vehicle_id) {
      const vehicle = await Vehicle.findOne({
        where: { id: vehicle_id, trash: false, school_id: school_id },
      });
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
    }

    if (driver_id) {
      const driver = await User.findOne({
        where: { id: driver_id, trash: false, school_id: school_id ,role:"driver"},
      });
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
    }


    const pickupRouteName = route_no
      ? `${start}-${stop}-${route_no}`
      : `${start}-${stop}`;
    const dropRouteName = route_no
      ? `${stop}-${start}-${route_no}`
      : `${stop}-${start}`;
    const existingRoute = await Routes.findOne({
      where: {
        school_id: school_id,
        route_name:pickupRouteName,
      },
    })
    if (existingRoute) {
      return res.status(400).json({ message: "Route already exists" });
    }
    const pickup_route = await Routes.create({
      school_id: school_id,
      route_name: pickupRouteName,
      vehicle_id: vehicle_id || null,
      driver_id: driver_id || null,
      type: "PICKUP",
      isLock: isLock ?? false,
      pickId: null,
      trash: false,
    });
    if (driver_id) {
      await RouteDrivers.create({
        route_id: pickup_route.id,
        driver_id: driver_id,
      });
    }

    let drop_route = null;
    if (hasDropRoute) {
      drop_route = await Routes.create({
        school_id: school_id,
        route_name: dropRouteName,
        vehicle_id: vehicle_id ?? null,
        driver_id: driver_id ?? null,
        type: "DROP",
        isLock: isLock ?? true,
        pickId: pickup_route.id,
        trash: false,
      });
      if (driver_id) {
        await RouteDrivers.create({
          route_id: drop_route.id,
          driver_id: driver_id,
        });
      }
    }
    res.status(201).json({
      message: "Route created successfully",
      pickup_route,
      drop_route,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error creating route:", error);
    console.error("Error creating route:", error);
    res.status(500).json({ error: "Failed to create route" });
  }
};

const getAllRoutes = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const routes = await Routes.findAll({
      where: {
        trash: false,
        school_id: school_id,
      },
      include: [
        {
          model: User,
          as: "drivers",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["vehicle_number"],
        },
        {
          model: Routes,
          as: "pickupRoute",
          attributes: ["id", "route_name"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });
    const dropRoutes = await Routes.findAll({
      where: { type: "DROP", trash: false, school_id: school_id },
      attributes: ["pickId"],
    });
    const dropRouteSet = new Set(dropRoutes.map((r) => r.pickId));
    const cleanRoutes = routes.map((route) => ({
      id: route.id,
      route_name: route.route_name,
      type: route.type,
      pickId: route.pickId || null,
      pickup_route_name: route.pickupRoute?.route_name || null,
      hasDropRoute: dropRouteSet.has(route.id),
      isLock: route.isLock,
      vehicle_number: route.vehicle?.vehicle_number || null,
      drivers: route.drivers.map((d) => {
        return { id: d.id, name: d.name };
      }),
    }));

    res.status(200).json({
      message: "Routes fetched successfully",
      routes: cleanRoutes,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error fetching vehicle:", error);
    console.error("Error fetching routes:", error);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
};

const assignStudentToRoute = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { student_ids, route_id } = req.body;

    if (
      !student_ids ||
      !Array.isArray(student_ids) ||
      student_ids.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "student_id and route_id required" });
    }

    const pickupRoute = await Routes.findOne({
      where: { id: route_id, trash: false, school_id: school_id },
    });

    if (!pickupRoute) {
      return res.status(404).json({ message: "Route not found" });
    }

    const students = await Student.findAll({
      where: { id: student_ids, trash: false, school_id: school_id },
    });

    if (students.length !== student_ids.length) {
      return res.status(404).json({ message: "Student not found" });
    }
    await pickupRoute.addStudents(students);

    return res.json({
      message: "Students assigned to route successfully",
      assignedCount: students.length,
      students: students.map((s) => ({ id: s.id, name: s.full_name })),
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error assigning student:", error);
    console.error(error);
    res.status(500).json({ error: "Failed to assign student" });
  }
};

const updateStudentToRoute = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { route_id } = req.params;
    const { student_ids } = req.body;

    if (
      !student_ids ||
      !Array.isArray(student_ids) ||
      student_ids.length === 0
    ) {
      return res.status(400).json({
        message: "student_ids array is required",
      });
    }

    const route = await Routes.findOne({
      where: { id: route_id, trash: false, school_id: school_id },
    });

    if (!route) {
      return res.status(404).json({
        message: "Route not found",
      });
    }

    const students = await Student.findAll({
      where: {
        id: student_ids,
        trash: false,
        school_id: school_id,
      },
    });

    if (students.length === 0) {
      return res.status(404).json({
        message: "No valid students found",
      });
    }

    await Student.update(
      { route_id: route_id },
      {
        where: {
          id: student_ids,
          trash: false,
          school_id: school_id,
        },
      },
    );

    return res.status(200).json({
      message: "Students updated to route successfully",
      updated_count: students.length,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Update Student To Route Error:", error);
    console.error("Update Student To Route Error:", error);
    return res.status(500).json({
      error: "Failed to update student",
    });
  }
};

const deleteStudentFromRoute = async (req, res) => {
  try {
    const { route_id } = req.params;
    const { student_ids } = req.body;
    const school_id = req.user.school_id;

    if (
      !student_ids ||
      !Array.isArray(student_ids) ||
      student_ids.length === 0
    ) {
      return res.status(400).json({
        message: "student_ids array is required",
      });
    }

    const routeInstance = await Routes.findOne({
      where: { id: route_id, trash: false, school_id: school_id },
    });

    if (!routeInstance) {
      return res.status(404).json({
        message: "Route not found",
      });
    }
    const existingAssignments = await Student.findAll({
      where: {
        route_id: route_id,
        id: student_ids,
      },
    });
    if (existingAssignments.length === 0) {
      return res.status(404).json({
        message: "Students not found in this route",
      });
    }
    const [affectedRows] = await Student.update(
      { route_id: null },
      {
        where: {
          route_id: route_id,
          id: student_ids,
        },
      },
    );
    return res.status(200).json({
      message: "Students removed from route successfully",
      removed_count: affectedRows,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Delete Student From Route Error:", error);
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const changeStudentRouteAndStop = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { route_id, stop_id } = req.body;
    const school_id = req.user.school_id;

    const student = await Student.findOne({
      where: { id: student_id, trash: false, school_id: school_id },
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const route = await Routes.findOne({
      where: { id: route_id, trash: false, school_id: school_id },
    });

    if (!route) {
      return res.status(404).json({
        message: "Route not found",
      });
    }

    const stop = await Stop.findOne({
      where: { id: stop_id,trash: false, },
      include: [
        {
          model: StopRoute,
          required: true,
          where: { route_id: route_id},
          attributes: ["priority"],
        },
      ],
    });

    if (!stop) {
      return res.status(404).json({
        message: "Stop not found",
      });
    }

    await student.update({ route_id: route_id, stop_id: stop_id });

    return res.status(200).json({
      message: "Student route and stop updated successfully",
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Change Student Route And Stop Error:", error);
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};  

const assignDriverToRoutes = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { routeIds } = req.body || {};
    const school_id = req.user.school_id;

    if (!routeIds || !Array.isArray(routeIds) || routeIds.length === 0) {
      return res.status(400).json({
        message: "routeIds must be a non-empty array",
      });
    }

    const driver = await User.findOne({
      where: { id: driverId, trash: false, school_id: school_id , role: "driver" },
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    const routes = await Routes.findAll({
      where: {
        id: routeIds,
        school_id: school_id,
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
    logger.error("schoolId:", req.user.school_id, "Assign Driver To Routes Error:", error);
    console.error("Error assigning driver to routes:", error);
    return res.status(500).json({
      error: "Failed to assign driver to routes",
    });
  }
};

const getDriversAssignedToRoutes = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const drivers = await User.findAll({
      where: { trash: false, school_id: school_id , role: "driver" },
      attributes: ["id", "name", "phone", "email", "dp"],
      include: [
        {
          model: Routes,
          as: "routes",
          attributes: ["id", "route_name"],
        },
      ],
    });

    return res.status(200).json({
      message: "Drivers assigned to routes fetched successfully",
      data: drivers,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Fetch Drivers Assigned To Routes Error:", error);
    console.error("Error fetching drivers assigned to routes:", error);
    return res.status(500).json({
      error: "Failed to fetch drivers assigned to routes",
    });
  }
};

const updateIsLock = async (req, res) => {
  try {
    const { route_id } = req.params;
    const { isLock } = req.body;
    const school_id = req.user.school_id;
    const route = await Routes.findOne({
      where: {
        id: route_id,
        trash: false,
        school_id: school_id,
      },
    });

    if (!route) {
      return res.status(404).json({
        message: "No route found",
      });
    }

    route.isLock = isLock;
    await route.save();

    return res.status(200).json({
      message: "Route lock status updated successfully",
      data: route,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Update Route Lock Status Error:", error);
    console.log("Error occurred:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getDriverLocation = async (req, res) => {
  try {
    const { driver_id } = req.params;
    const school_id = req.user.school_id;
    const driver = await User.findOne({
      where: {
        id: driver_id,
        trash: false,
        school_id: school_id,
        role: "driver",
      },
      include: [
        {
          model: Routes,
          as: "routes",
          attributes: ["id", "route_name", "active", "activated_by_driver_id"],
          include: [
            {
              model: Stop,
              as: "stops",
              attributes: [
                "id",
                "stop_name",
                "latitude",
                "longitude",
                "arrived",
                "arrived_time",
              ],
            },
          ],
        },
      ],
    });

    if (!driver) {
      return res.status(404).json({
        error: "Driver not found",
      });
    }

    let currentStop = null;
    let activeRoute = null;

    if (driver.routes && driver.routes.length > 0) {
      activeRoute = driver.routes.find(
        (route) => route.active && route.activated_by_driver_id === driver.id,
      );
      if (!activeRoute) {
        activeRoute = driver.routes[0];
      }

      const stops = activeRoute.stops;

      if (stops && stops.length > 0) {
        const arrivedStops = stops.filter((stop) => stop.arrived);

        if (arrivedStops.length > 0) {
          arrivedStops.sort((a, b) => {
            const timeA = a.arrived_time
              ? new Date(a.arrived_time).getTime()
              : 0;
            const timeB = b.arrived_time
              ? new Date(b.arrived_time).getTime()
              : 0;
            return timeB - timeA;
          });
          currentStop = arrivedStops[0];
        }
      }
    }

    return res.status(200).json({
      message: "Driver location fetched successfully",
      data: {
        driver_id: driver.id,
        driver_name: driver.name,
        route_id: activeRoute ? activeRoute.id : null,
        route_name: activeRoute ? activeRoute.route_name : null,
        current_stop: currentStop,
      },
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Fetch Driver Error:", error);
    console.error("Error fetching driver:", error);
    return res.status(500).json({
      error: "Failed to fetch driver",
    });
  }
};

const getExams = async (req, res) => {
    try {
      const school_id = req.user.school_id || "";
      const searchQuery = req.query.q || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10; 
      const offset = page && limit ? (page - 1) * limit : 0;
      let whereClause = {
        school_id,
        trash: false,
    };
    if (searchQuery) {
      whereClause[Op.or] = [{ exam_name: { [Op.like]: `%${searchQuery}%` } }];
    }
    const { count, rows: exams } = await Exam.findAndCountAll({
      offset,
      limit,
      distinct: true,
      where: whereClause,
      order: [
        ["publish", "ASC"],
        ["education_year", "DESC"],
        ["id", "DESC"],
      ],
    });
   
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      success: true,
      totalcontent: count,
      totalPages,
      currentPage: page,
      data: exams,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      error: e.message,
    });
  }
};
const getTrashedExams = async (req, res) => {
     try {
      const school_id = req.user.school_id || "";
      const searchQuery = req.query.q || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10; 
      const offset = page && limit ? (page - 1) * limit : 0;
      let whereClause = {
        school_id,
        trash: true,
    };
    if (searchQuery) {
      whereClause[Op.or] = [{ exam_name: { [Op.like]: `%${searchQuery}%` } }];
    }
    const { count, rows: exams } = await Exam.findAndCountAll({
      offset,
      limit,
      distinct: true,
      where: whereClause,
      order: [
        ["publish", "ASC"],
        ["education_year", "DESC"],
        ["id", "DESC"],
      ],
    });
   
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      success: true,
      totalcontent: count,
      totalPages,
      currentPage: page,
      data: exams,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      error: e.message,
    });
  }
}

const getExamMarksByExamId = async (req, res) => {
  try {
    const school_id = req.user.school_id || "";
    const { exam_id } = req.params;
    const class_id = req.query.class_id || null;
    const subject_id = req.query.subject_id || null;
    const teacher_id = req.query.teacher_id || null;
    const start_date = req.query.start_date || null;
    const end_date = req.query.end_date || null;
    const internal_name = req.query.internal_name || null;  
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; 
    const offset = page && limit ? (page - 1) * limit : 0;

    let whereClause = {
      school_id,
      trash: false,
      exam_id,
    };
    if (class_id) {
      whereClause.class_id = class_id;
    }
    if (subject_id) {
      whereClause.subject_id = subject_id;
    }
    if (teacher_id) {
      whereClause.recorded_by = teacher_id;
    }
    if(internal_name){
      whereClause.internal_name = internal_name;
    }
 
    
    if (!exam_id) {
      return res.status(400).json({ error: "Exam ID is required" });
    }

    const { count, rows: internalMarks } = await InternalMark.findAndCountAll({
      limit,
      offset,
      distinct: true,
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp", "role"],
        },
        { model: Class, attributes: ["id", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
      ],
      order: [
        ["id", "DESC"],
      ],
    });

     const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      success: true,
      totalcontent: count,
      totalPages,
      currentPage: page,
      data: internalMarks,
      
    });
  } catch (error) {
    logger.error("Error fetching internal marks by exam id:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch internal marks",
      error: error.message,
    });
  }
};

const getMarksByInternalId = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id || "";

    if (!id) {
      return res.status(400).json({ error: "Internal mark ID is required" });
    }

    const marks = await Marks.findAll({
      where: {
        internal_id: id,
      },
      include: [
        {
          model: Student,
          attributes: [
            "id",
            "reg_no",
            "full_name",
            "image",
            "roll_number",
            "class_id",
          ],
        },
        {
          model: InternalMark,
          attributes: ["id", "internal_name", "max_marks", "date", "exam_id"],
          where: { school_id },
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Marks fetched successfully",
      data: marks,
    });
  } catch (error) {
    logger.error("Error fetching marks by internal id:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch marks",
      error: error.message,
    });
  }
};

const createExam = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { exam_name, publish, education_year } = req.body;

    if (!exam_name || !education_year) {
      return res
        .status(400)
        .json({ error: "Exam name and education year are required" });
    }

    const exam = await Exam.create({
      school_id,
      exam_name,
      publish: publish || false,
      education_year,
    });

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: exam,
    });
  } catch (error) {
    logger.error("school_id:", school_id, "Error creating exam:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create exam",
      error: error.message,
    });
  }
};

const editExam = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const { exam_name, publish, education_year } = req.body;

    const exam = await Exam.findOne({ where: { id, school_id, trash: false } });

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    await exam.update({
      exam_name: exam_name || exam.exam_name,
      publish: publish !== undefined ? publish : exam.publish,
      education_year: education_year || exam.education_year,
    });

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      data: exam,
    });
  } catch (error) {
    logger.error("school_id:", school_id, "Error updating exam:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update exam",
      error: error.message,
    });
  }
};

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const exam = await Exam.findOne({ where: { id, school_id, trash: false } });

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    await exam.update({ trash: true });

    return res.status(200).json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    logger.error("school_id:", school_id, "Error deleting exam:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete exam",
      error: error.message,
    });
  }
};

const restoreExam = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const exam = await Exam.findOne({ where: { id, school_id, trash: true } });

    if (!exam) {
      return res.status(404).json({ error: "Exam not found in trash" });
    }

    await exam.update({ trash: false });

    return res.status(200).json({
      success: true,
      message: "Exam restored successfully",
    });
  } catch (error) {
    logger.error("school_id:", school_id, "Error restoring exam:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to restore exam",
      error: error.message,
    });
  }
};
const permanentDeleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const exam = await Exam.findOne({ where: { id, school_id, trash: true } });

    if (!exam) {
      return res.status(404).json({ error: "Exam not found in trash" });
    }
    const internalMarks = await InternalMark.findAll({
      where: { exam_id: id, trash: false },
    });    
    if (internalMarks.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot permanently delete exam with associated internal marks",
      });
    }
    await exam.destroy();

    return res.status(200).json({
      success: true,
      message: "Exam permanently deleted",
    });
  } catch (error) {
    logger.error("school_id:", school_id, "Error permanently deleting exam:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to permanently delete exam",
      error: error.message,
    });
  }
}

const updateExamPublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { publish } = req.body;
    const school_id = req.user.school_id || "";

    if (publish === undefined) {
      return res.status(400).json({ error: "Publish status is required" });
    }

    const exam = await Exam.findOne({
      where: {
        id,
        school_id,
      },
    });

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    await exam.update({ publish });

    return res.status(200).json({
      success: true,
      message: `Exam publish status updated to ${publish}`,
      data: exam,
    });
  } catch (error) {
    logger.error("school_id:", school_id, "Error updating exam publish status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update exam publish status",
      error: error.message,
    });
  }
};

// Exam Timetable CRUD
const createExamTimetable = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;
    const {
      exam_id,
      subject_id,
      title,
      standard,
      exam_date,
      start_time,
      duration_minutes,
      max_marks,
      pass_marks,
      instructions,
      status,
    } = req.body;

    if (!exam_id || !subject_id || !exam_date || !standard || !title) {
      return res.status(400).json({
        success: false,
        error: "exam_id, subject_id, exam_date, and start_time are required",
      });
    }

    const exam = await Exam.findOne({
      where: { id: exam_id, school_id, trash: false },
    });
    if (!exam) {
      return res.status(404).json({ success: false, error: "Exam not found" });
    }

    const subject = await Subject.findOne({
      where: { id: subject_id, trash: false },
    });
    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" });
    }
    const existExamTimetable = await ExamTimetable.findOne({
      where: { exam_id, subject_id, standard, exam_date, trash: false },
    });
    if (existExamTimetable) {
      return res.status(400).json({ success: false, error: "Exam timetable already exists" });
    }
    const examTimetable = await ExamTimetable.create({
      school_id,
      exam_id,
      subject_id,
      title: title || null,
      standard,
      exam_date,
      start_time,
      duration_minutes: duration_minutes || null,
      max_marks: max_marks !== undefined ? max_marks : null,
      pass_marks: pass_marks !== undefined ? pass_marks : null,
      instructions: instructions || null,
      status: status || "scheduled",
      recorded_by,
    });

    return res.status(201).json({
      success: true,
      message: "Exam timetable created successfully",
      data: examTimetable,
    });
  } catch (error) {
    logger.error("school_id:", req.user?.school_id, "Error creating exam timetable:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create exam timetable",
      error: error.message,
    });
  }
};

const updateExamTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const {
      exam_id,
      subject_id,
      title,
      standard,
      exam_date,
      start_time,
      duration_minutes,
      max_marks,
      pass_marks,
      instructions,
      status,
    } = req.body;

    const examTimetable = await ExamTimetable.findOne({
      where: { id, school_id, trash: false },
    });

    if (!examTimetable) {
      return res.status(404).json({ success: false, error: "Exam timetable not found" });
    }

    if (exam_id) {
      const exam = await Exam.findOne({
        where: { id: exam_id, school_id, trash: false },
      });
      if (!exam) {
        return res.status(404).json({ success: false, error: "Exam not found" });
      }
    }

    if (subject_id) {
      const subject = await Subject.findOne({
        where: { id: subject_id, trash: false },
      });
      if (!subject) {
        return res.status(404).json({ success: false, error: "Subject not found" });
      }
    }
    const existExamTimetable = await ExamTimetable.findOne({
      where: { exam_id: exam_id || examTimetable.exam_id, subject_id: subject_id || examTimetable.subject_id, standard: standard || examTimetable.standard, exam_date: exam_date || examTimetable.exam_date, trash: false, id: { [Op.ne]: id } },
    });
    if (existExamTimetable) {
      return res.status(400).json({ success: false, error: "Exam timetable already exists" });
    }

    await examTimetable.update({
      exam_id: exam_id !== undefined ? exam_id : examTimetable.exam_id,
      subject_id: subject_id !== undefined ? subject_id : examTimetable.subject_id,
      title: title !== undefined ? title : examTimetable.title,
      standard: standard !== undefined ? standard : examTimetable.standard,
      exam_date: exam_date !== undefined ? exam_date : examTimetable.exam_date,
      start_time: start_time !== undefined ? start_time : examTimetable.start_time,
      duration_minutes: duration_minutes !== undefined ? duration_minutes : examTimetable.duration_minutes,
      max_marks: max_marks !== undefined ? max_marks : examTimetable.max_marks,
      pass_marks: pass_marks !== undefined ? pass_marks : examTimetable.pass_marks,
      instructions: instructions !== undefined ? instructions : examTimetable.instructions,
      status: status !== undefined ? status : examTimetable.status,
    });

    return res.status(200).json({
      success: true,
      message: "Exam timetable updated successfully",
      data: examTimetable,
    });
  } catch (error) {
    logger.error("school_id:", req.user?.school_id, "Error updating exam timetable:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update exam timetable",
      error: error.message,
    });
  }
};

const getAllExamTimetables = async (req, res) => {
  try {
    const school_id = req.user.school_id || "";
    const exam_id = req.query.exam_id || null;
    const subject_id = req.query.subject_id || null;
    const status = req.query.status || null;
    const start_date = req.query.start_date || null;
    const end_date = req.query.end_date || null;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {
      school_id,
      trash: false,
    };

    if (exam_id) whereClause.exam_id = exam_id;
    if (subject_id) whereClause.subject_id = subject_id;
    if (status) whereClause.status = status;

    if (start_date && end_date) {
      whereClause.exam_date = { [Op.between]: [start_date, end_date] };
    } else if (start_date) {
      whereClause.exam_date = { [Op.gte]: start_date };
    } else if (end_date) {
      whereClause.exam_date = { [Op.lte]: end_date };
    }

    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { instructions: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { count, rows: timetables } = await ExamTimetable.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      distinct: true,
      include: [
        {
          model: Exam,
          attributes: ["id", "exam_name", "education_year", "publish"],
        },
        {
          model: Subject,
          attributes: ["id", "subject_name", "class_range", "is_multi_teacher", "priority"],
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
      order: [
        ["id", "DESC"],
      ],
    });

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({
      success: true,
      totalcontent: count,
      totalPages,
      currentPage: page,
      data: timetables,
    });
  } catch (error) {
    logger.error("school_id:", req.user?.school_id, "Error fetching exam timetables:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam timetables",
      error: error.message,
    });
  }
};

const getExamTimetableById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const examTimetable = await ExamTimetable.findOne({
      where: { id, school_id, trash: false },
      include: [
        {
          model: Exam,
          attributes: ["id", "exam_name", "education_year", "publish"],
        },
        {
          model: Subject,
          attributes: ["id", "subject_name", "class_range", "is_multi_teacher", "priority"],
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
    });

    if (!examTimetable) {
      return res.status(404).json({ success: false, error: "Exam timetable not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Exam timetable fetched successfully",
      data: examTimetable,
    });
  } catch (error) {
    logger.error("school_id:", req.user?.school_id, "Error fetching exam timetable by id:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam timetable",
      error: error.message,
    });
  }
};

const deleteExamTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const examTimetable = await ExamTimetable.findOne({
      where: { id, school_id, trash: false },
    });

    if (!examTimetable) {
      return res.status(404).json({ success: false, error: "Exam timetable not found" });
    }

    await examTimetable.update({ trash: true });

    return res.status(200).json({
      success: true,
      message: "Exam timetable deleted successfully",
    });
  } catch (error) {
    logger.error("school_id:", req.user?.school_id, "Error deleting exam timetable:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete exam timetable",
      error: error.message,
    });
  }
};

const getTrashedExamTimetables = async (req, res) => {
  try {
    const school_id = req.user.school_id || "";
    const exam_id = req.query.exam_id || null;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let whereClause = {
      school_id,
      trash: true,
    };

    if (exam_id) whereClause.exam_id = exam_id;

    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { instructions: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { count, rows: timetables } = await ExamTimetable.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      distinct: true,
      include: [
        {
          model: Exam,
          attributes: ["id", "exam_name", "education_year", "publish"],
        },
        {
          model: Subject,
          attributes: ["id", "subject_name", "class_range", "priority"],
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
      order: [["id", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({
      success: true,
      totalcontent: count,
      totalPages,
      currentPage: page,
      data: timetables,
    });
  } catch (error) {
    logger.error("school_id:", req.user?.school_id, "Error fetching trashed exam timetables:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch trashed exam timetables",
      error: error.message,
    });
  }
};

const restoreExamTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const examTimetable = await ExamTimetable.findOne({
      where: { id, school_id, trash: true },
    });

    if (!examTimetable) {
      return res.status(404).json({ success: false, error: "Exam timetable not found in trash" });
    }

    await examTimetable.update({ trash: false });

    return res.status(200).json({
      success: true,
      message: "Exam timetable restored successfully",
    });
  } catch (error) {
    logger.error("school_id:", req.user?.school_id, "Error restoring exam timetable:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to restore exam timetable",
      error: error.message,
    });
  }
};

const permanentDeleteExamTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const examTimetable = await ExamTimetable.findOne({
      where: { id, school_id, trash: true },
    });

    if (!examTimetable) {
      return res.status(404).json({ success: false, error: "Exam timetable not found in trash" });
    }

    await examTimetable.destroy();

    return res.status(200).json({
      success: true,
      message: "Exam timetable permanently deleted",
    });
  } catch (error) {
    logger.error("school_id:", req.user?.school_id, "Error permanently deleting exam timetable:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to permanently delete exam timetable",
      error: error.message,
    });
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassesByYear,
  getSpecialClassesByYear,
  getWithOutSpecialClassesByYear,
  getTrashedClasses,
  restoreClass,
  permanentDeleteClass,

  addSpecialClassStudents,
  getSpecialClassStudents,
  deleteSpecialClassStudent,

  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectsForFilter,
  getTrashedSubjects,
  restoreSubject,
  permanentDeleteSubject,

  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  restoredStaff,
  updateStaffUser,
  getAllTeachers,
  getStaffs,
  getTrashedStaffs,
  permanentDeleteStaff,

  getAllStaffPermissions,
  updateStaffPermission,
  getStaffPermissionByUser,
  deleteStaffPermission,

  createGuardian,
  getAllGuardians,
  getGuardianById,
  updateGuardian,
  createGuardianService,
  deleteGuardian,

  getGuardianBySchoolId,
  updateGuardianUserPassword,

  createStudent,
  bulkCreateStudents,
  getAllStudents,
  getStudentById,
  updateStudent,
  bulkUpdateStudentsToAlumni,
  bulkUpdateStudentsClass,
  getAlumniStudents,
  deleteStudent,
  getTrashedStudents,
  restoreStudent,
  permanentDeleteStudent, 
  getTrashedAlumniStudents,

  createDutyWithAssignments,
  getDutyById,
  getAllTeacherDuties,
  getAllStaffDuties,
  updateDuty,
  deleteDuty,
  getTrashedDuties,
  restoreDuty,
  permanentDeleteDuty,
  updateDutyAssigned,
  bulkUpdateDutyAssignments,

  createAchievementWithStudents,
  getAllAchievements,
  getAchievementById,
  updateAchievement,
  deleteAchievement,
  getTrashedAchievements,
  restoreAchievement,
  updateStudentAchievement,
  peremententDeleteAchievement,

  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  restoreEvent,
  getTrashedEvents,
  permanentDeleteEvent,

  createPayment,
  getAllPayments,
  getDonations,
  getPaymentById,
  updatePayment,
  deletePayment,
  restorePayment,
  getTrashedPayments,
  getTrashedDonations,
  permanentDeletePayment,
  paymentVerification,

  createInvoice,
  addInvoiceStudentsbyInvoiceId,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  restoreInvoice,
  permanentDeleteInvoiceStudent,
  getTrashedInvoices,

  createLeaveRequest,
  // getAllLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  leaveRequestPermission,
  staffLeaveRequestPermission,
  deleteLeaveRequest,
  getTrashedLeaveRequests,
  restoreLeaveRequest,
  permanentDeleteLeaveRequest,
  getAllStaffLeaveRequests,
  getAllTeacherLeaveRequests,
  getAllStudentLeaveRequests,

  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
  getTrashedNews,
  restoreNews,
  permanentDeleteNews,
  deleteNewsImage,

  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
  permanentDeleteNotice,
  getTrashedNotices,
  restoreNotice,
  getLatestNotices,

  bulkUpsertTimetable,
  getAllTimetables,
  getTimetableById,
  deleteTimetableEntry,
  getTimetablesWithClassId,
  getTimetablesConflicts,
  getTimetableByTeacherId,

  getAllTeacherLeaveRequestsforSubstitution,
  getPeriodsForleaveRequestedTeacher,
  getFreeStaffForPeriod,

  createSubstitution,
  bulkCreateSubstitution,
  getAllSubstitutions,
  getSubstitutionById,
  updateSubstitution,
  deleteSubstitution,

  getSchoolAttendanceSummary,
  getNavigationBarCounts,
  dashboardCounts,

  getAllInternalMarks,
  getAllTermExams,
  getInternalmarkById,
  updateInternalMark,
  deleteInternalMark,
  restoreInternalMark,
  permanentDeleteInternalMark,
  getTrashedInternalMarks,
  getTrashedTermExams,

  getHomeworkById,
  updateHomework,
  deleteHomework,
  restoreHomework,
  getTrashedHomework,
  permanentDeleteHomework,
  getAttendanceById,

  createStaffAttendance,
  updateStaffAttendance,
  getAllStaffAttendance,
  getStaffAttendanceById,
  getStaffAttendanceByDate,
  bulkCreateStaffAttendance,
  deleteStaffAttendance,

  createRoute,
  createVehicle,
  createDriver,
  createStop,
  assignStudentToRoute,
  getAllVehicles,
  getVehicleById,
  deleteVehicle,
  getAllRoutes,
  assignDriverToRoutes,
  getAllDrivers,
  updateStudentToRoute,
  deleteStudentFromRoute,
  changeStudentRouteAndStop,
  updateVehicle,
  getDriversAssignedToRoutes,
  updateIsLock,
  getDriverLocation,
  
  getExams,
  getExamMarksByExamId,
  getMarksByInternalId,
  updateExamPublishStatus,
  createExam,
  editExam,
  deleteExam,
  getTrashedExams,
  permanentDeleteExam,
  restoreExam,

  createExamTimetable,
  updateExamTimetable,
  getAllExamTimetables,
  getExamTimetableById,
  deleteExamTimetable,
  getTrashedExamTimetables,
  restoreExamTimetable,
  permanentDeleteExamTimetable,
};
