const moment = require("moment");
const bcrypt = require("bcrypt");
const { Op, where } = require("sequelize");
const logger = require("../utils/logger");
const {
  compressAndSaveFile,
  deletefilewithfoldername,
  compressAndSaveMultiFile,
} = require("../utils/fileHandler");
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
const { schoolSequelize } = require("../config/connection");
const studentRoutes = require("../models/studentroutes");
const Stop = require("../models/stop");
const { Driver } = require("../models");
const { Vehicle } = require("../models");
const studentroutes = require("../models/studentroutes");
const { error } = require("winston");

// CREATE
const createClass = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { year, division, classname } = req.body;
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
    });
    res.status(201).json({ message: "Class created", class: newClass });
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "Error creating class:", err);
    console.error("Error creating class:", err);
    res.status(500).json({ error: err.message });
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
    let whereCondition = {
      school_id: req.user.school_id,
      trash: false,
    };
    if (searchQuery) {
      whereCondition.classname = { [Op.like]: `%${searchQuery}%` };
    }
    if (year) {
      whereCondition.year = year;
    }
    if (division) {
      whereCondition.division = division;
    }

    const { count, rows: classes } = await Class.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereCondition,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      classes,
    });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching classes:",
      err,
    );
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "Error fetching class:", err);
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "Error fetching class:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
const updateClass = async (req, res) => {
  try {
    const id = req.params.id;
    const { year, division, classname } = req.body;
    const updated = await Class.update(
      { year, division, classname },
      { where: { id, school_id: req.user.school_id } },
    );
    res.status(200).json({ message: "Class updated", updated });
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "Error updating class:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE (soft delete)
const deleteClass = async (req, res) => {
  try {
    const id = req.params.id;
    await Class.update({ trash: true }, { where: { id } });
    res.status(200).json({ message: "Class soft-deleted" });
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "Error deleting class:", err);
    res.status(500).json({ error: err.message });
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
    });

    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      classes,
    });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching trashed classes:",
      err,
    );
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error restoring class:",
      err,
    );
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error permanently deleting class:",
      err,
    );
    res.status(500).json({ error: err.message });
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
    const { subject_name, class_range } = req.body;
    if (!subject_name || !class_range || !school_id) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    if (
      class_range !== "1-4" &&
      class_range !== "5-7" &&
      class_range !== "8-10" &&
      class_range !== "11-12" &&
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
      syllabus_id: schoolData.syllabus_id,
    });
    res.status(201).json(subject);
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error creating subject:",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};
//managing subjects
const getSubjects = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const school_id = req.user.school_id;
    const range = req.query.range || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
      attributes: ["id", "subject_name", "class_range"],
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting subjects:",
      err,
    );
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting subject by ID:",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const { subject_name, class_range } = req.body;

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

    const subject = await Subject.findByPk(id);
    if (!subject || subject.trash)
      return res.status(404).json({ error: "Subject not found" });

    await subject.update({ subject_name, class_range, school_id });
    res.status(200).json(subject);
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating subject:",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};

// Delete Subject (Soft Delete)
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject || subject.trash)
      return res.status(404).json({ error: "Subject not found" });

    subject.trash = true;
    await subject.save();

    res.status(200).json({ message: "Subject deleted (soft)" });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting subject:",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};
const getSubjectsForFilter = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const range = req.query.range || "";
    const school_id = req.user.school_id;
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
      whereClause.range = range;
    }

    const subjects = await Subject.findAll({
      distinct: true,
      where: whereClause,
      attributes: ["id", "subject_name"],
    });
    res.status(200).json({
      totalcontent: subjects.length,
      subjects,
    });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting subjects for filter:",
      err,
    );
    res.status(500).json({ error: err.message });
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
    });
    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      subjects,
    });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting trashed subjects:",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};
// Restore Subject
const restoreSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject || !subject.trash)
      return res.status(404).json({ error: "Subject not found" });

    subject.trash = false;
    await subject.save();

    res.status(200).json({ message: "Subject restored" });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error restoring subject:",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};

// Permanent Delete Subject
const permanentDeleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject || !subject.trash)
      return res.status(404).json({ error: "Subject not found" });

    await subject.destroy();
    res.status(200).json({ message: "Subject permanently deleted" });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error permanently deleting subject:",
      err,
    );
    res.status(500).json({ error: err.message });
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
    } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    /////
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

    let fileName = null;

    if (req.file) {
      const uploadPath = "uploads/dp/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    const hashedPassword = await bcrypt.hash(phone, 10);
    const user = await User.create(
      {
        name: name,
        email: email,
        phone: phone,
        password: hashedPassword,
        school_id: school_id,
        dp: fileName,
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
        class_id: class_id || null,
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

    if (!role || role === "teacher") {
      await StaffPermission.create(
        {
          user_id: user.id,
          leave_request: true,
          attendance: true,
          timetable: true,
          marks: true,
          students: true,
          homeworks: true,
          parent_notes: true,
          achievements: true,
          student_leave_request: true,
          chats: true,
        },
        { transaction },
      );
    } else if (role === "staff") {
      await StaffPermission.create(
        {
          user_id: user.id,
          leave_request: true,
          attendance: true,
          students: true,
          achievements: true,
          payments: true,
          reports: true,
        },
        { transaction },
      );
    }

    res.status(201).json(newStaff);
    await transaction.commit();
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "Error creating staff:", err);
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
    const role = req.query.role || ""; // 'all' or 'active'
    let whereCondition = {
      school_id: school_id,
      trash: false,
    };
    if (role) {
      whereCondition.role = role;
    }
    const staff = await Staff.findAll({
      offset,
      distinct: true,
      limit,
      where: whereCondition,
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
      ],

      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(staff.length / limit);
    res.status(200).json({
      totalcontent: staff.length,
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
    const staff = await Staff.findOne({
      where: {
        id: staff_id,
        trash: false,
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
    const { role, qualification, address, class_id, subjects } = req.body;

    const staff = await Staff.findOne({
      where: { id: staff_id, school_id },
    });
    if (!staff || staff.trash) {
      await transaction.rollback();
      return res.status(404).json({ error: "Staff not found" });
    }

    await staff.update(
      { role, qualification, address, class_id },
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
    let fileName = user.dp;

    if (req.file) {
      const uploadPath = "uploads/dp/";
      const oldFileName = user.dp;
      fileName = await compressAndSaveFile(req.file, uploadPath);
      await deletefilewithfoldername(oldFileName, uploadPath);
    }
    const user = await User.findOne({
      where: { id: user_id },
    });
    const hashedPassword = await bcrypt.hash(phone, 10);
    await user.update({
      name: name,
      email: email,
      phone: phone,
      password: hashedPassword,
      school_id: school_id,
      dp: fileName,
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
    const staff = await Staff.findByPk(staff_id);
    if (!staff || staff.trash)
      return res.status(404).json({ error: "Staff not found" });
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
    const staff = await Staff.findByPk(staff_id);
    if (staff && !staff.trash)
      return res.status(404).json({ error: "Staff not found" });
    const user = await User.findByPk(staff.user_id);
    if (!user && user.trash)
      return res.status(404).json({ error: "user not found" });

    await staff.update({ trash: false });
    await user.update({ trash: false });
    res.status(200).json({ message: "successfully restored staff " });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getTrashedStaffs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: staffs } = await Staff.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        trash: true,
      },
    });
    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      staffs,
    });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting trashed staffs:",
      err,
    );
    res.status(500).json({ error: err.message });
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
    let whereCondition = {
      school_id: school_id,
      trash: false,
      role: "teacher",
    };

    const staff = await Staff.findAll({
      offset,
      distinct: true,
      limit,
      where: whereCondition,
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

      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(staff.length / limit);
    res.status(200).json({
      totalcontent: staff.length,
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
    const permissions = await StaffPermission.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp", "school_id"],
          where: school_id,
        },
      ],
    });
    res.json({ success: true, data: permissions });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting staff permissions:",
      err,
    );
    res.status(500).json({ error: "Failed to fetch staff permissions" });
  }
};

// READ single staff permission
const getStaffPermissionByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const permission = await StaffPermission.findOne({ where: { user_id } });

    if (!permission) {
      return res.status(404).json({ error: "Permissions not found" });
    }

    res.json({ success: true, data: permission });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting staff permission:",
      err,
    );
    res.status(500).json({ error: "Failed to fetch staff permission" });
  }
};

// UPDATE staff permission
const updateStaffPermission = async (req, res) => {
  try {
    const { user_id } = req.params;
    const {
      leave_request,
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
    } = req.body;

    const permission = await StaffPermission.findOne({ where: { user_id } });
    if (!permission) {
      return res.status(404).json({ error: "Permissions not found" });
    }

    await permission.update({
      leave_request,
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
    });
    res.json({ success: true, data: permission });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating staff permission:",
      err,
    );
    res.status(500).json({ error: "Failed to update staff permission" });
  }
};

// DELETE staff permission

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
    let fileName = null;

    if (req.file) {
      const uploadPath = "uploads/dp/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    const hashedPassword = await bcrypt.hash(guardian_contact, 10);

    const user = await User.create({
      role: "guardian",
      name: guardian_name,
      email: guardian_email || null,
      phone: guardian_contact,
      dp: fileName,
      school_id: school_id,
      status: "active",
      password: hashedPassword,
    });

    const guardian = await Guardian.create({
      user_id: user.id,
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

    let fileName = null;
    if (fileBuffer) {
      const file = fileBuffer;
      const uploadPath = "uploads/dp/";
      fileName = await compressAndSaveFile(file, uploadPath);
    }
    const contactStr = String(guardian_contact);

    const password = guardian_name.slice(0, 3) + contactStr.slice(0, 5);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      role: "guardian",
      name: guardian_name,
      email: guardian_email || null,
      phone: guardian_contact,
      dp: fileName,
      school_id,
      status: "active",
      password: hashedPassword,
    });
    console.log("User created with ID:", user.id);

    const guardian = await Guardian.create({
      user_id: user.id,
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
    });
    console.log("Guardian created with ID:", guardian);

    return user.id;
  } catch (error) {
    logger.error("Error creating guardian service:", error);
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting guardians:",
      err,
    );
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting guardians:",
      err,
    );
    res.status(500).json({ error: err.message });
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
    if (req.file) {
      const uploadPath = "uploads/dp/";
      const oldFileName = user.dp;
      fileName = await compressAndSaveFile(req.file, uploadPath);
      await deletefilewithfoldername(oldFileName, uploadPath);
    }
    await user.update({
      name: guardian.guardian_name,
      email: guardian.guardian_email,
      phone: guardian.guardian_contact,
      dp: fileName,
    });
    //
    res.status(200).json(guardian);
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating guardian:",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};
const deleteGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    const guardian = await Guardian.findByPk(id);
    if (!guardian) return res.status(404).json({ error: "Guardian not found" });

    await guardian.update({ trash: true });
    res.status(200).json({ message: "Guardian moved to trash." });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting guardians:",
      err,
    );
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating guardian user password:",
      err,
    );
    res.status(500).json({ error: err.message });
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

      // Guardian Data (all inside req.body)

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
    } = req.body;
    const guardian_email = req.body.guardian_email || null;
    const guardian_relation = req.body.guardian_relation || "father";

    if (
      (!guardian_contact || !full_name || !reg_no || !class_id, !roll_number)
    ) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    const existingRollNumber = await Student.findOne({
      where: { roll_number, school_id, class_id, trash: false },
    });
    if (existingRollNumber) {
      return res.status(400).json({
        error: "Roll number already exists in student table for this class",
      });
    }
    const existingUser = await User.findOne({
      where: { phone: guardian_contact },
    });
    const existingRegNo = await Student.findOne({
      where: { reg_no },
    });

    if (existingRegNo) {
      return res
        .status(400)
        .json({ error: "Reg number already exists in student table" });
    }

    let guardianUserId;
    const guardianDpFile = req.files?.dp?.[0];
    const studentImageFile = req.files?.image?.[0];
    console.log("existingUser:", existingUser);

    if (existingUser) {
      const existingGuardian = await Guardian.findOne({
        where: { user_id: existingUser.id },
      });

      if (!existingGuardian) {
        return res
          .status(400)
          .json({ error: "User exists but no guardian record found." });
      }

      guardianUserId = existingGuardian.user_id;
    } else {
      if (guardian_email) {
        const existingEmail = await User.findOne({
          where: { email: guardian_email },
        });
        if (existingEmail && guardian_email !== "") {
          return res.status(400).json({
            error: "Guardian email already exists in user table",
          });
        }
      }
      if (!guardian_name || !guardian_contact || !guardian_relation) {
        return res
          .status(400)
          .json({ error: "Required fields are missing for guardian data" });
      }

      const guardianData = {
        guardian_email,
        guardian_name,
        guardian_contact,
        guardian_relation: normalizeGuardianRelation(guardian_relation),
        guardian_job,
        guardian2_name,
        guardian2_relation: normalizeGuardianRelation(guardian2_relation),
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

      const newGuardian = await createGuardianService(
        guardianData,
        guardianDpFile,
      );
      guardianUserId = newGuardian;
    }
    let fileName = null;
    if (studentImageFile) {
      const uploadPath = "uploads/students_images/";
      fileName = await compressAndSaveFile(studentImageFile, uploadPath);
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error creating student:",
      err,
    );
    console.error("Error creating student:", err);
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
        where: { reg_no },
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
        if (guardian_email) {
          const existingEmail = await User.findOne({
            where: { email: guardian_email },
            transaction,
          });
          if (existingEmail && guardian_email !== "") {
            throw new Error(
              `Guardian email  ${existingEmail.email} already exists with other phone number `,
            );
          }
        }

        if (!guardian_name || !guardian_contact) {
          throw new Error(
            `Required guardian fields missing for student: ${full_name}'s guardian details`,
          );
        }

        const guardianData = {
          guardian_email,
          guardian_name,
          guardian_contact,
          guardian_relation: normalizeGuardianRelation(guardian_relation),
          guardian_job,
          guardian2_name,
          guardian2_relation: normalizeGuardianRelation(guardian2_relation),
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

      // ✅ Student image upload
      // let fileName = null;
      // const studentImageFile = req.files?.[`student_${roll_number}`]?.[0];
      // if (studentImageFile) {
      //   const uploadPath = "uploads/students_images/";
      //   fileName = await compressAndSaveFile(studentImageFile, uploadPath);
      // }

      createdStudents.push({
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error bulk creating students:",
      err,
    );
    await transaction.rollback();
    console.error("Error bulk creating students:", err);
    return res.status(500).json({ error: err.message });
  }
};
const getAllStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: students } = await Student.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        school_id,
        full_name: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },

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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error fetching students:",
      err,
    );
    console.error("Error fetching students:", err);
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
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting student:",
      err,
    );
    console.error("Error getting student:", err);
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
    } = req.body;
    if (reg_no) {
      const existingRegNo = await Student.findOne({
        where: { reg_no, id: { [Op.ne]: id } },
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

    let studentImageFilename = student.image;

    // Update image if provided
    if (req.file) {
      const studentImageFile = req.file;
      const uploadPath = "uploads/students_images/";
      await deletefilewithfoldername(studentImageFilename, uploadPath);
      studentImageFilename = await compressAndSaveFile(
        studentImageFile,
        uploadPath,
      );
    }

    const updated = await student.update({
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
    });

    res.status(200).json({ message: "Student updated successfully", updated });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating student:",
      err,
    );
    console.error("Error updating student:", err);
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

    await student.update({ trash: true });

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting student:",
      err,
    );
    console.error("Error deleting student:", err);
    res.status(500).json({ error: "Failed to delete student" });
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

    let storedFileName = null;
    if (req.file) {
      uploadDir = "uploads/duties/";
      storedFileName = await compressAndSaveFile(req.file, uploadDir);
    }

    const duty = await Duty.create(
      {
        school_id,
        title,
        description,
        start_date: start_date || new Date(),
        deadline,
        file: storedFileName,
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "createDutyWithAssignments →",
      err,
    );
    if (uploadDir) await deletefilewithfoldername(req.file, uploadDir);
    await transaction.rollback();
    console.error("createDutyWithAssignments →", err);
    res.status(500).json({ error: err.message });
  }
};

const getAllDuties = async (req, res) => {
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
      limit,
      where: whereClause,
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
      ],
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

    const totalPages = Math.ceil(totalCount / limit);
    res.status(200).json({
      totalcontent: totalCount,
      totalPages: download === "true" ? null : totalPages,
      currentPage: download === "true" ? null : page,
      duties: formattedData,
    });
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "getAllDuties →", err);
    res.status(500).json({ error: "Failed to fetch duties" });
  }
};
const getDutyById = async (req, res) => {
  try {
    const duty = await Duty.findByPk(req.params.id, {
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
      ],
    });

    if (!duty) {
      return res.status(404).json({ error: "Duty not found" });
    }

    res.json(duty);
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "getDutyById →", err);
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
    let fileName = null;
    if (req.file) {
      uploadPath = "uploads/duties/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
      await deletefilewithfoldername(duty.file, uploadPath);
    }
    await duty.update({
      title,
      description,
      deadline,
      start_date,
      file: fileName ? fileName : duty.file,
    });
    res.json(duty);
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "updateDuty →", err);
    res.status(500).json({ error: "Failed to update duty" });
  }
};
const updateDutyAssigned = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks, status } = req.body;

    const assignedDuty = await DutyAssignment.findByPk(id);
    if (!assignedDuty) {
      return res.status(404).json({ error: "Not found" });
    }
    let fileName = assignedDuty.solved_file;
    if (req.file) {
      uploadPath = "uploads/solved_duties/";
      await deletefilewithfoldername(fileName, uploadPath);
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    const updatedDuty = await assignedDuty.update({
      status,
      remarks,
      solved_file: fileName ? fileName : null,
    });
    res.json({ message: "Updated", updatedDuty });
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "updateDutyAssigned →", err);
    res.status(500).json({ error: err.message });
  }
};
const bulkUpdateDutyAssignments = async (req, res) => {
  const transaction = await schoolSequelize.transaction();
  try {
    const { duty_id, updates } = req.body;

    if (!duty_id || !Array.isArray(updates)) {
      return res
        .status(400)
        .json({ error: "duty_id and updates array are required" });
    }

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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "deleteDuty →", err);
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
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      duties,
    });
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "getTrashedDuties →", err);
    res.status(500).json({ error: err.message });
  }
};

const restoreDuty = async (req, res) => {
  try {
    const { id } = req.params;
    const duty = await Duty.findByPk(id);
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
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    await DutyAssignment.destroy({ where: { duty_id: id, school_id } });
    await Duty.destroy({ where: { id } });
    res.json({ message: "Peremently Deleted Duty" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//manage Achievements
const uploadAchievementPath = "uploads/achievement_proofs/";

const createAchievementWithStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const {
      title,
      description,
      category,
      level,
      date,
      awarding_body,
      recorded_by,
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
        let compressedFileName = null;

        if (req.files && req.files[index]) {
          compressedFileName = await compressAndSaveMultiFile(
            req.files[index],
            uploadAchievementPath,
          );
        }

        return {
          achievement_id: achievement.id,
          student_id: student.student_id,
          status: student.status,
          proof_document: compressedFileName,
          remarks: student.remarks,
        };
      }),
    );

    await StudentAchievement.bulkCreate(studentAchievements);

    res.status(201).json({
      message: "Achievement with students saved successfully",
      achievement,
    });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "createAchievementWithStudents →",
      err,
    );
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
const getAllAchievements = async (req, res) => {
  try {
    const school_id = req.user.school_id;
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
      distinct: true,
      limit,
      where: whereClause,
      attributes: ["id", "title", "description", "category", "level", "date"],
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
  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "getAllAchievements →",
      error,
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAchievementById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const achievement = await Achievement.findOne({
      where: { id: req.params.id, school_id, trash: false },
      attributes: ["id", "title", "description", "category", "level", "date"],
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
    const achievement = await Achievement.findByPk(req.params.id, {
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
      recorded_by,
    } = req.body;

    await achievement.update({
      title,
      description,
      category,
      level,
      date,
      awarding_body,
      recorded_by,
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
    await Achievement.update(
      { trash: false },
      { where: { id: req.params.id } },
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
    const { status, proof_document, remarks } = req.body;
    if (
      status !== "1st prize" &&
      status !== "2nd prize" &&
      status !== "3rd prize" &&
      status !== "participant" &&
      status !== "other"
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const StudentAchievementData = await StudentAchievement.findOne({
      where: { id: req.params.id, school_id },
      attributes: ["id", "status", "proof_document", "remarks"],
      include: [
        {
          model: Achievement,
          attributes: ["id", "title"],
        },
      ],
    });
    if (!StudentAchievementData) {
      return res.status(404).json({ error: "Student achievement not found" });
    }

    let AchievementFilename = StudentAchievementData.proof_document;
    if (req.file) {
      await deletefilewithfoldername(
        AchievementFilename,
        uploadAchievementPath,
      );
      AchievementFilename = await compressAndSaveFile(
        req.file,
        uploadAchievementPath,
      );
    }
    await StudentAchievementData.update({
      status,
      proof_document,
      remarks,
      proof_document: AchievementFilename ? AchievementFilename : null,
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
    for (const sa of studentAchievements) {
      await deletefilewithfoldername(sa.proof_document, uploadAchievementPath);
    }

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
    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/event_files/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    const event = await Event.create({
      school_id,
      title,
      description,
      date,
      user_id: req.user.user_id,
      url,
      venue,
      file: fileName ? fileName : null,
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

    let fileName = event.file;
    if (req.file) {
      const uploadPath = "uploads/event_files/";
      await deletefilewithfoldername(fileName, uploadPath);
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    await event.update({
      school_id,
      title,
      description,
      date,
      url,
      venue,
      file: fileName,
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
    const { count, rows: events } = await Event.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { trash: true },
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
    await Event.update({ trash: false }, { where: { id: req.params.id } });
    res.status(200).json({ message: "Event restored successfully" });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "restoreEvent :", error);
    res.status(500).json({ error: error.message });
  }
};
const permanentDeleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    const uploadPath = "uploads/event_files/";
    await deletefilewithfoldername(event.file, uploadPath);
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
    const {
      student_id,
      invoice_student_id,
      amount,
      payment_date,
      payment_type,
      transaction_id,
      payment_method,
      payment_status,
    } = req.body;

    if (
      !school_id ||
      !amount ||
      !payment_date ||
      !payment_type ||
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
        school_id,
        student_id,
        amount,
        payment_date,
        payment_type,
      },
    });
    if (existingPayment) {
      return res
        .status(400)
        .json({ error: "Payment with the same details already exists" });
    }

    const payment = await Payment.create({
      school_id,
      student_id,
      invoice_student_id,
      amount,
      payment_date,
      payment_type,
      transaction_id,
      payment_method,
      payment_status,
      recorded_by: req.user.user_id,
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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "createPayment :", err);
    res.status(500).json({ error: err.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const payment_type = req.query.payment_type || "";
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
      payment_type &&
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
      ].includes(payment_type)
    )
      return res
        .status(400)
        .json({ error: "Invalid payment type" }, { status: 400 });
    let whereClause = {
      trash: false,
      school_id: school_id,
      payment_type: { [Op.ne]: "donation" },
    };

    if (payment_type) {
      whereClause.payment_type = payment_type;
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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "getAllPayments :", err);
    res.status(500).json({ error: err.message });
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
      payment_type: "donation",
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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "getAllPayments :", err);
    res.status(500).json({ error: err.message });
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
      ],
    });
    if (!payment || payment.trash)
      return res.status(404).json({ error: "Payment not found" });
    res.status(200).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePayment = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const {
      student_id,
      amount,
      payment_date,
      payment_type,
      transaction_id,
      payment_status,
      payment_method,
    } = req.body;
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
        payment_type,

        id: { [Op.ne]: Id },
      },
    });
    if (existingPayment) {
      return res
        .status(400)
        .json({ error: "Payment with the same details already exists" });
    }
    await payment.update({
      student_id,
      amount,
      payment_date,
      payment_type,
      transaction_id,
      payment_status,
      payment_method,
    });
    res.status(200).json({ message: "Payment updated", payment });
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "updatePayment :", err);
    res.status(500).json({ error: err.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    await Payment.update(
      { trash: true },
      { where: { id: req.params.id, school_id } },
    );
    res.status(200).json({ message: "Payment soft deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTrashedPayments = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const payment_type = req.query.payment_type || "";
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
      payment_type &&
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
      ].includes(payment_type)
    )
      return res
        .status(400)
        .json({ error: "Invalid payment type" }, { status: 400 });
    let whereClause = {
      trash: true,
      school_id: school_id,
      payment_type: { [Op.ne]: "donation" },
    };

    if (payment_type) {
      whereClause.payment_type = payment_type;
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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "getAllPayments :", err);
    res.status(500).json({ error: err.message });
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
      payment_type: "donation",
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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "getAllPayments :", err);
    res.status(500).json({ error: err.message });
  }
};
const restorePayment = async (req, res) => {
  try {
    await Payment.update({ trash: false }, { where: { id: req.params.id } });
    res.status(200).json({ message: "Payment restored successfully" });
  } catch (err) {
    exi;
    res.status(500).json({ error: err.message });
  }
};
const permanentDeletePayment = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    const data = await Payment.findOne({
      where: { trash: true, id: req.params.id },
    });
    if (!data) {
      return res.status(404).json({
        error: "Payment not found ",
      });
    }
    if (data.school_id !== school_id || data.recorded_by !== user_id) {
      return res.status(403).json({
        error: "You do not have permission to delete this payment",
      });
    }
    await Payment.destroy({
      where: {
        id: req.params.id,
        trash: true,
        school_id,
        recorded_by: user_id,
      },
    });
    res.status(200).json({ message: "Payment permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "createInvoice :", err);
    res.status(500).json({ error: err.message });
  }
};
const addInvoiceStudentsbyInvoiceId = async (req, res) => {
  try {
    const { id } = req.params; // invoice_id
    const {
      student_ids, // array of student_ids to attach
    } = req.body;

    const invoice = await Invoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    if (student_ids && Array.isArray(student_ids)) {
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
    });
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      invoices,
    });
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "getAllInvoices :", err);
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "updateInvoice :", err);
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "deleteInvoice :", err);
    res.status(500).json({ error: err.message });
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
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      invoices,
    });
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "getTrashedInvoices :", err);
    res.status(500).json({ error: err.message });
  }
};
const restoreInvoice = async (req, res) => {
  try {
    await Invoice.update({ trash: false }, { where: { id: req.params.id } });
    res.status(200).json({ message: "Invoice restored" });
  } catch (err) {
    logger.error("schoolId:", req.user.school_id, "restoreInvoice :", err);
    res.status(500).json({ error: err.message });
  }
};
const permanentDeleteInvoiceStudent = async (req, res) => {
  try {
    const { id } = req.params; // invoice_student_id
    const invoiceStudent = await InvoiceStudent.findByPk(id);
    if (!invoiceStudent) {
      return res.status(404).json({ error: "Not found" });
    }
    await invoiceStudent.destroy();
    res.status(200).json({ message: "Invoice student deleted" });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "permanentDeleteInvoiceStudent :",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};
// Leave Request Management
const leaverequestFilePath = "uploads/leave_requests/";

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

    let fileName = null;
    if (req.file) {
      const uploadPath = leaverequestFilePath;
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    const data = await LeaveRequest.create({
      school_id: school_id,
      user_id: user_id ? user_id : admin_id,
      student_id: student_id,
      role: role ? role : "student",
      from_date: from_date,
      to_date: to_date,
      leave_type: leave_type,
      reason: reason,
      attachment: fileName ? fileName : null,
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

const getAllLeaveRequests = async (req, res) => {
  try {
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
    logger.error(
      "schoolId:",
      req.user.school_id,
      "getAllLeaveRequests :",
      error,
    );
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
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
    let fileName = data.attachment;
    if (req.file) {
      const uploadPath = leaverequestFilePath;
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
      // status: status ? status : "pending",
      // admin_remarks,
      // approved_by: userId ? userId : null,
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
    if (status === "approved") {
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
          status: "On Leave",
          check_in_time: null,
          check_out_time: null,
          created_at: new Date(),
          updated_at: new Date(),
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
      order: [["createdAt", "DESC"]],
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

    const leave = await LeaveRequest.findOne({
      where: { id: id, trash: true },
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
    const leave = await LeaveRequest.findOne({
      where: { id: id, trash: true },
    });
    if (!leave) return res.status(404).json({ error: "Not found" });
    if (leave.attachment) {
      const uploadPath = leaverequestFilePath;
      await deletefilewithfoldername(leave.attachment, uploadPath);
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
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image"],
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
    // let fileName = null;
    // if (req.files?.file?.[0]) {
    //   fileName = req.files.file[0];
    //   const uploadPath = newsfilePath;
    //   fileName = await compressAndSaveFile(fileName, uploadPath);
    // }

    const news = await News.create({
      school_id,
      title,
      content,
      date,
      user_id,
      // file: fileName,
    });

    if (req.files?.images) {
      const imageRecords = [];

      for (const img of req.files.images) {
        const compressedName = await compressAndSaveFile(img, newsimagePath);
        imageRecords.push({
          news_id: news.id,
          image_url: compressedName,
        });
      }

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
    // let fileName = news.file;
    // if (req.file) {
    //   const uploadPath = newsfilePath;
    //   fileName = await compressAndSaveFile(req.file, uploadPath);
    // }
    await news.update({ title, content, date });

    if (req.files?.images) {
      const imageRecords = [];

      for (const img of req.files.images) {
        const compressedName = await compressAndSaveFile(img, newsimagePath);
        imageRecords.push({
          news_id: news.id,
          image_url: compressedName,
        });
      }

      await NewsImage.bulkCreate(imageRecords);
    }
    res.json({ message: "Updated", news });
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
      "Error fetching trashed news:",
      error,
    );
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};
const restoreNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findOne({ where: { id, trash: true } });
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
    const news = await News.findOne({ where: { id, trash: true } });
    if (!news) return res.status(404).json({ error: "Not found" });
    // if (news.file) {
    //   const uploadPath = newsfilePath;
    //   await deletefilewithfoldername(news.file, uploadPath);
    // }
    const newsImages = await NewsImage.findAll({ where: { news_id: id } });
    for (const img of newsImages) {
      if (img.image_url) {
        const uploadPath = newsimagePath;
        await deletefilewithfoldername(img.image_url, uploadPath);
      }
      await img.destroy();
    }
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
    const newsImage = await NewsImage.findOne({ where: { id, trash: false } });
    if (!newsImage) return res.status(404).json({ error: "Not found" });
    if (newsImage.image_url) {
      const uploadPath = newsimagePath;
      await deletefilewithfoldername(newsImage.image_url, uploadPath);
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
const noticeFilePath = "uploads/notices/";
const createNotice = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { title, content, type, class_ids } = req.body;
    const date = req.body.date ? req.body.date : new Date();
    let fileName = null;
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

    if (req.file) {
      const uploadPath = noticeFilePath;
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    const notice = await Notice.create({
      school_id,
      title,
      content,
      file: fileName,
      type,
      date,
    });

    if (type === "classes" && Array.isArray(class_ids)) {
      const mappings = class_ids.map((cid) => ({
        notice_id: notice.id,
        class_id: cid,
      }));
      await NoticeClass.bulkCreate(mappings);
    }

    res.status(201).json({ message: "Notice created", notice });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error creating notice:",
      err,
    );
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    let fileName = notice.file || null;
    if (req.file) {
      const uploadPath = noticeFilePath;
      if (fileName) {
        await deletefilewithfoldername(fileName, uploadPath);
      }
      await deletefilewithfoldername(fileName, uploadPath);
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    await notice.update({ title, content, type, file: fileName });

    if (type === "classes") {
      await NoticeClass.destroy({ where: { notice_id: id } });
      const mappings = class_ids.map((cid) => ({
        notice_id: id,
        class_id: cid,
      }));
      await NoticeClass.bulkCreate(mappings);
    }

    res.json({ message: "Notice updated" });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error updating notice:",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await Notice.update({ trash: true }, { where: { id: id } });
    if (!rows) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Notice soft-deleted" });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error deleting notice:",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};
const permanentDeleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findOne({ where: { id: id, trash: true } });
    if (!notice) return res.status(404).json({ error: "Not found" });
    if (notice.file) {
      const uploadPath = noticeFilePath;
      await deletefilewithfoldername(notice.file, uploadPath);
    }
    await NoticeClass.destroy({ where: { notice_id: id } });
    await notice.destroy();
    res.json({ message: "Notice permanently deleted" });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error permanently deleting notice:",
      err,
    );
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error getting trashed notices:",
      err,
    );
    res.status(500).json({ error: err.message });
  }
};
const restoreNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await Notice.update({ trash: false }, { where: { id: id } });
    if (!rows) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Notice restored" });
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error restoring notice:",
      err,
    );
    res.status(500).json({ error: err.message });
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
          attributes: ["id", "name"],
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
    console.log(periodCount);
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
      order: [["createdAt", "DESC"]],
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
  } catch (err) {
    console.error("Error creating substitution:", err);
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    console.error("Error bulk creating substitutions:", err);
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    console.error("Error fetching substitutions:", err);
    res.status(500).json({ error: err.message });
  }
};
const getSubstitutionById = async (req, res) => {
  try {
    const { id } = req.params;
    const substitution = await TimetableSubstitution.findOne({
      where: { id },
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
  } catch (err) {
    console.error("Error fetching substitution:", err);
    res.status(500).json({ error: err.message });
  }
};

const updateSubstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const { sub_staff_id, subject_id, reason } = req.body;
    if (!id || !sub_staff_id || !subject_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updated = await TimetableSubstitution.update(
      { sub_staff_id, subject_id, reason },
      {
        where: { id },
      },
    );
    res.json({ message: "Substitution updated", updated });
  } catch (err) {
    console.error("Error updating substitution:", err);
    res.status(500).json({ error: err.message });
    console.log(err);
  }
};

const deleteSubstitution = async (req, res) => {
  try {
    const { id } = req.params;
    await TimetableSubstitution.destroy({ where: { id } });
    res.json({ message: "Substitution deleted" });
  } catch (err) {
    console.error("Error deleting substitution:", err);
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "Error in getSchoolAttendanceSummary:",
      err,
    );
    console.error("Error in getSchoolAttendanceSummary:", err);
    res.status(500).json({ error: err.message });
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
      where: { school_id, trash: false },
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

const getInternalmarkById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { id } = req.params;
    const internalmark = await InternalMark.findOne({
      attributes: ["id", "internal_name", "max_marks", "date"],
      where: { id, school_id },
      include: [
        { model: Class, attributes: ["classname"] },
        { model: Subject, attributes: ["subject_name"] },
        { model: User, attributes: ["name"] },
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
  } catch (err) {
    console.error("Error in getInternalmarkById:", err);
    res.status(500).json({ error: err.message });
  }
};
const getHomeworkById = async (req, res) => {
  try {
    const { id } = req.params;

    const homework = await Homework.findOne({
      attributes: ["id", "title", "description", "due_date", "file"],
      where: { id, trash: false },
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
  } catch (err) {
    console.error("Error in getHomeworkById:", err);
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    console.error("Error in getAttendanceById:", err);
    res.status(500).json({ error: err.message });
  }
};

const createStaffAttendance = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { staff_id, date, status, check_in_time, check_out_time, remarks } =
      req.body;

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
        check_in_time || check_in_time || status === "present"
          ? new Date().toISOString()
          : null,
      check_out_time: check_out_time || null,
      total_hours,
      marked_by: req.user.user_id,
      marked_method: "Manual",
      remarks,
    });

    res.status(201).json({
      message: "Attendance added successfully",
      attendance,
    });
  } catch (error) {
    console.error("Error adding attendance:", error);
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
    const count = await StaffAttendance.count({ where: whereClause });
    const records = await StaffAttendance.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          where: searchQuery ? { name: { [Op.like]: `%${searchQuery}%` } } : {},
          attributes: ["id", "name"],
        },
      ],
      order: [["date", "DESC"]],
      offset,
      limit,
    });
    const totalPages = Math.ceil(count / limit);

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
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const whereClause = {
      role: { [Op.in]: ["teacher", "staff"] },
      school_id,
    };
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
    //Check route exists
    const route = await studentroutes.findOne({
      where: { id: route_id, trash: false },
    });

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Check stop name uniqueness per route
    const existingStop = await Stop.findOne({
      where: {
        route_id,
        trash: false,
      },
    });

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
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

//create driver✅
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

    let photoPath = null;
    const driverPhoto = req.files?.photo?.[0];

    if (driverPhoto) {
      const uploadPath = "uploads/driver_images/";
      photoPath = await compressAndSaveFile(driverPhoto, uploadPath);
    }

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
    console.error("Error creating driver:", error);
    res.status(500).json({ error: error.message });
  }
};

//get all drivers
const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.findAll({
      where: {
        trash: false,
      },
      attributes: ["id", "name", "phone", "email", "photo"],
    });

    return res.status(200).json({
      message: "Fetched successfully",
      data: drivers,
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return res.status(500).json({
      error: "Failed to fetch drivers",
    });
  }
};

//create vechicle✅
const createVehicle = async (req, res) => {
  try {
    const { type, model, vehicle_number, photo, driver_id } = req.body;

    if (!vehicle_number) {
      return res.status(400).json({ message: "Vehicle number is required" });
    }

    // Validate driver (if provided)
    if (driver_id) {
      const driver = await Driver.findOne({
        where: { id: driver_id, trash: false },
      });

      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
    }

    const vehicle = await Vehicle.create({
      type,
      model,
      vehicle_number,
      photo,
      driver_id,
      trash: false,
    });

    res.status(201).json({
      message: "Vehicle created successfully",
      vehicle,
    });
  } catch (error) {
    logger.error("Error creating vehicle:", error);
    console.error("Error creating vehicle:", error);
    res.status(500).json({ error: "Failed to create vehicle" });
  }
};

//getAllVehicles✅
const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { trash: false },
      include: [
        {
          model: Driver,
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
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
};

//getVehicleById✅
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findOne({
      where: { id, trash: false },
      include: [
        {
          model: Driver,
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
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ error: "Failed to fetch vehicle" });
  }
};

//delete vehicle✅
const deleteVehicle = async (res, req) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findOne({
      where: {
        id,
        trash: false,
      },
    });

    if (!vehicle) {
      return res.status(404).json({ message: "vehicle not found" });
    }

    await vehicle.update({ trash: true });
    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
};

//create route✅
const createRoute = async (req, res) => {
  try {
    const { route_name, vehicle_id, driver_id, type, isLock } = req.body;

    if (!route_name) {
      return res.status(400).json({ message: "Route name is required" });
    }

    // Validate vehicle
    if (vehicle_id) {
      const vehicle = await Vehicle.findOne({
        where: { id: vehicle_id, trash: false },
      });
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
    }

    // Validate driver
    if (driver_id) {
      const driver = await Driver.findOne({
        where: { id: driver_id, trash: false },
      });
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
    }

    const route = await studentroutes.create({
      route_name,
      vehicle_id: vehicle_id || null,
      driver_id: driver_id || null,
      type,
      isLock: isLock ?? true,
      trash: false,
    });

    res.status(201).json({
      message: "Route created successfully",
      route,
    });
  } catch (error) {
    logger.error("Error creating route:", error);
    console.error("Error creating route:", error);
    res.status(500).json({ error: "Failed to create route" });
  }
};

//getAllRoute
const getAllRoutes = async (req, res) => {
  try {
    const routes = await studentroutes.findAll({
      where: {
        trash: false,
      },

      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Routes fetched successfully",
      routes,
    });
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
};

//adding students to route
const assignStudentToRoute = async (req, res) => {
  try {
    const { student_id, route_id } = req.body;

    if (!student_id || !route_id) {
      return res
        .status(400)
        .json({ message: "student_id and route_id required" });
    }

    const route = await studentroutes.findOne({
      where: { id: route_id, trash: false },
    });

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const student = await Student.findOne({
      where: { id: student_id, trash: false },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.route_id = route_id;
    await student.save();

    res.json({
      message: "Student assigned to route successfully",
      student,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to assign student" });
  }
};

//assign drivers to routes
const assignDriverToRoutes = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { routeIds } = req.body || {};

    if (!routeIds || !Array.isArray(routeIds) || routeIds.length === 0) {
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
    const routes = await studentroutes.findAll({
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
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassesByYear,
  getTrashedClasses,
  restoreClass,
  permanentDeleteClass,

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

  getAllStaffPermissions,
  updateStaffPermission,
  getStaffPermissionByUser,

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
  deleteStudent,
  // getStudentsByClassId,

  createDutyWithAssignments,
  getDutyById,
  getAllDuties,
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
  getAllLeaveRequests,
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

  getInternalmarkById,
  getHomeworkById,
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
  getAllDrivers
};
