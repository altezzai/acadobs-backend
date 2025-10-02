const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { Op, where, DATEONLY } = require("sequelize");
const {
  compressAndSaveFile,
  deletefilewithfoldername,
  compressAndSaveMultiFile,
  compressImage,
} = require("../utils/fileHandler");
const Staff = require("../models/staff");
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
const { School } = require("../models");
const { schoolSequelize } = require("../config/connection");

// const { create } = require("domain");
// const { time } = require("console");

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
        year,
        division,
        classname,
        school_id,
        trash: false,
      },
    });

    if (existingClass) {
      return res.status(409).json({
        message:
          "Class with same year, division, and name already exists in this school.",
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
    console.error("Error creating class:", err);
    res.status(500).json({ error: err.message });
  }
};

// READ ALL
const getAllClasses = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const year = req.query.year || "";
    const division = req.query.division || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: classes } = await Class.findAndCountAll({
      offset,
      distinct: true,
      limit,

      where: {
        classname: { [Op.like]: `%${searchQuery}%` },
        year: { [Op.like]: `%${year}%` },
        division: { [Op.like]: `%${division}%` },
        school_id: req.user.school_id,
        trash: false,
      },
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      classes,
    });
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
};
//i want get year and division of class by class id
const getClassesByYear = async (req, res) => {
  try {
    const year = req.params.year;
    const classData = await Class.findAll({
      where: {
        year: year,
        school_id: req.user.school_id,
      },
      attributes: ["id", "division", "classname"],
    });

    if (!classData) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(classData);
  } catch (err) {
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
      { where: { id, school_id: req.user.school_id } }
    );
    res.status(200).json({ message: "Class updated", updated });
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
};

// Create Subject
const createSubject = async (req, res) => {
  try {
    const school_id = req.user.school_id;
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
    });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read All Subjects
const getSubjects = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const range = req.query.range || "";

    // const subjects = await Subject.findAll({
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: subjects } = await Subject.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        subject_name: { [Op.like]: `%${searchQuery}%` },
        class_range: { [Op.like]: `%${range}%` },
        trash: false,
      },
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      subjects,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getSubjectById = async (req, res) => {
  try {
    const id = req.params.id;
    const subject = await Subject.findByPk(id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Update Subject
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_name, class_range, school_id } = req.body;

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
      { transaction }
    );
    const newStaff = await Staff.create(
      {
        school_id,
        user_id: user.id,
        role,
        qualification,
        address,
        class_id,
      },
      { transaction }
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
    res.status(201).json(newStaff);

    await transaction.commit();
  } catch (error) {
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
    const { count, rows: staff } = await Staff.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereCondition,
      include: [
        {
          model: User,
          where: {
            name: { [Op.like]: `%${searchQuery}%` },
          },
          attributes: ["id", "name", "email", "phone", "dp", "role"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      staff,
    });
  } catch (error) {
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
    const user = await User.findOne({
      where: { id: staff.user_id, trash: false },
      attributes: ["id", "name", "email", "phone", "dp"],
    });
    if (!user) return res.status(404).json({ error: "user not found" });
    res.status(200).json({ staff, user });
  } catch (error) {
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
      { transaction }
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
        (id) => !existingSubjectIds.includes(id)
      );
      const toRemove = existingSubjectIds.filter(
        (id) => !newSubjectIds.includes(id)
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
    let fileName = null;

    if (req.file) {
      const uploadPath = "uploads/dp/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
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
    } = req.body;
    if (!guardian_name || !guardian_email || !guardian_contact) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    // const file = req.file;
    const existingUser = await User.findOne({
      where: { email: guardian_email },
    });
    const existingPhone = await User.findOne({
      where: { phone: guardian_contact },
    });

    if (existingUser) {
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
      email: guardian_email,
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
    });

    res.status(201).json({ user, guardian });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const createGuardianService = async (guardianData, fileBuffer, req) => {
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
  } = guardianData;

  if (!guardian_name || !guardian_email || !guardian_contact) {
    throw new Error("Required guardian fields are missing");
  }

  const existingUser = await User.findOne({
    where: { email: guardian_email },
  });
  const existingPhone = await User.findOne({
    where: { phone: guardian_contact },
  });

  if (existingUser) {
    throw new Error("Guardian email already exists");
  }

  let fileName = null;
  if (fileBuffer) {
    const file = fileBuffer;
    const uploadPath = "uploads/dp/";
    fileName = await compressAndSaveFile(file, uploadPath);
  }

  const hashedPassword = await bcrypt.hash(guardian_contact, 10);

  const user = await User.create({
    role: "guardian",
    name: guardian_name,
    email: guardian_email,
    phone: guardian_contact,
    dp: fileName,
    school_id,
    status: "active",
    password: hashedPassword,
  });

  await Guardian.create({
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
  });

  return user.id;
};
const getAllGuardians = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
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
      include: [{ model: User, attributes: ["name", "email", "phone", "dp"] }],
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      guardians,
    });
  } catch (err) {
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
    } = req.body;
    const guardian = await Guardian.findByPk(id);
    if (!guardian) return res.status(404).json({ error: "Guardian not found" });

    if (guardian_email) {
      const existingUser = await User.findOne({
        where: {
          email: guardian_email,
          id: { [Op.ne]: guardian.user_id },
        },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Guardian email already exists in user table" });
      }
    }
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

    await guardian.update({
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
    });
    if (req.file) {
      const uploadPath = "uploads/dp/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    const user = await User.findOne({
      where: { id: guardian.user_id },
    });
    if (!user) return res.status(404).json({ error: "user not found" });

    await user.update({
      name: guardian.guardian_name,
      email: guardian.guardian_email,
      phone: guardian.guardian_contact,
      dp: fileName,
    });
    //
    res.status(200).json(guardian);
  } catch (err) {
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
      status,

      // Guardian Data (all inside req.body)
      guardian_email,
      guardian_name,
      guardian_relation,
      guardian_job,
      guardian2_name,
      guardian2_relation,
      guardian2_contact,
      guardian2_job,
      father_name,
      mother_name,
    } = req.body;
    const guardian_contact = req.body.guardian_contact || null;

    if ((!guardian_email || !full_name || !reg_no || !class_id, !roll_number)) {
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
      where: { email: guardian_email },
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
      if (guardian_contact) {
        const existingPhone = await User.findOne({
          where: { phone: guardian_contact },
        });
        if (existingPhone) {
          return res.status(400).json({
            error: "Guardian phone number already exists in user table",
          });
        }
      }
      if (
        !guardian_name ||
        !guardian_email ||
        !guardian_contact ||
        !guardian_relation
      ) {
        return res
          .status(400)
          .json({ error: "Required fields are missing for guardian data" });
      }

      const guardianData = {
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
        school_id,
      };

      const newGuardian = await createGuardianService(
        guardianData,
        guardianDpFile
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
      gender,
      class_id,
      admission_date,
      address,
      status,
      image: fileName ? fileName : null,
    });

    res.status(201).json({ success: true, student });
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(500).json({ error: "Failed to create student" });
  }
};
const bulkCreateStudents = async (req, res) => {
  const transaction = await schoolSequelize.transaction();
  try {
    const school_id = req.user.school_id;
    const studentsData = req.body.students; // expect array
    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      return res.status(400).json({ error: "No students provided" });
    }

    const createdStudents = [];

    for (const studentObj of studentsData) {
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
      } = studentObj;

      if (
        !guardian_email ||
        !full_name ||
        !reg_no ||
        !class_id ||
        !roll_number
      ) {
        throw new Error("Required fields missing for student: " + full_name);
      }

      // ✅ Check duplicate roll_number in same class
      const existingRoll = await Student.findOne({
        where: { roll_number, school_id, class_id, trash: false },
        transaction,
      });
      if (existingRoll) {
        throw new Error(
          `Roll number ${roll_number} already exists for class ${class_id}`
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
        where: { email: guardian_email },
        transaction,
      });

      if (existingUser) {
        const existingGuardian = await Guardian.findOne({
          where: { user_id: existingUser.id },
          transaction,
        });
        if (!existingGuardian) {
          throw new Error(
            `Guardian user exists but no guardian record found for email ${guardian_email}`
          );
        }
        guardianUserId = existingGuardian.user_id;
      } else {
        if (guardian_contact) {
          const existingPhone = await User.findOne({
            where: { phone: guardian_contact },
            transaction,
          });
          if (existingPhone) {
            throw new Error(
              `Guardian phone number ${guardian_contact} already exists`
            );
          }
        }

        if (!guardian_name || !guardian_contact || !guardian_relation) {
          throw new Error(
            `Required guardian fields missing for student: ${full_name}`
          );
        }

        const guardianData = {
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
          school_id,
        };

        // Guardian dp upload (if any) -> expect req.files keyed by something like `dp_${index}`
        const guardianDpFile = req.files?.[`dp_${roll_number}`]?.[0];

        const newGuardianId = await createGuardianService(
          guardianData,
          guardianDpFile,
          transaction
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
        gender,
        class_id,
        admission_date,
        address,
        status,
        // image: fileName,
      });
    }

    // ✅ Bulk insert all students in one go
    const inserted = await Student.bulkCreate(createdStudents, { transaction });

    await transaction.commit();
    return res.status(201).json({
      success: true,
      count: inserted.length,
      students: inserted,
    });
  } catch (err) {
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
        uploadPath
      );
    }

    const updated = await student.update({
      school_id,
      reg_no,
      roll_number,
      full_name,
      date_of_birth,
      gender,
      class_id,
      address,
      admission_date,
      status,
      image: studentImageFilename,
    });

    res.status(200).json({ message: "Student updated successfully", updated });
  } catch (err) {
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
      { transaction }
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
      }
    );

    await transaction.commit();

    res.status(201).json({
      message: "Duty and assignments created",
      duty,
      assignments: createdAssignments,
    });
  } catch (err) {
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
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
    const { count, rows: duties } = await Duty.findAndCountAll({
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
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      duties,
    });
  } catch (err) {
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
      (id) => !newStaffIds.includes(id)
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
          }
        );
      } else {
        await DutyAssignment.create(
          {
            duty_id,
            staff_id: item.staff_id,

            status: item.status || "pending",
            remarks: item.remarks || null,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();
    res.status(200).json({ message: "Duty assignments synced successfully" });
  } catch (error) {
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
    res.status(500).json({ error: "Delete failed duty" });
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

    const uploadPath = "uploads/achievement_proofs/";

    const studentAchievements = await Promise.all(
      parsedStudents.map(async (student, index) => {
        let compressedFileName = null;

        if (req.files && req.files[index]) {
          compressedFileName = await compressAndSaveMultiFile(
            req.files[index],
            uploadPath
          );
        }

        return {
          achievement_id: achievement.id,
          student_id: student.student_id,
          status: student.status,
          proof_document: compressedFileName,
          remarks: student.remarks,
        };
      })
    );

    await StudentAchievement.bulkCreate(studentAchievements);

    res.status(201).json({
      message: "Achievement with students saved successfully",
      achievement,
    });
  } catch (err) {
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
      distinct: true, // Add this line
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
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAchievement = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    await Achievement.update(
      { trash: true },
      { where: { id: req.params.id, school_id } }
    );
    res.status(200).json({ message: "Achievement trashed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
const restoreAchievement = async (req, res) => {
  try {
    await Achievement.update(
      { trash: false },
      { where: { id: req.params.id } }
    );
    res.status(200).json({ message: "Achievement restored successfully" });
  } catch (error) {
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
    const uploadPath = "uploads/achievement_proofs/";
    if (req.file) {
      await deletefilewithfoldername(AchievementFilename, uploadPath);
      AchievementFilename = await compressAndSaveFile(req.file, uploadPath);
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
    res.status(500).json({ error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    await Event.update(
      { trash: true },
      { where: { id: req.params.id, school_id } }
    );
    res.status(200).json({ message: "Event soft deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const restoreEvent = async (req, res) => {
  try {
    await Event.update({ trash: false }, { where: { id: req.params.id } });
    res.status(200).json({ message: "Event restored successfully" });
  } catch (error) {
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
    const existingTransaction_id = await Payment.findOne({
      where: { transaction_id },
    });
    if (existingTransaction_id) {
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
    res.status(500).json({ error: err.message });
  }
};

const getAllPayments = async (req, res) => {
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
        { payment_type: { [Op.like]: `%${searchQuery}%` } },
        { amount: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (date) {
      whereClause.payment_date = date;
    }
    const { count, rows: payment } = await Payment.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image"],
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
    if (existingTransaction_id) {
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
    res.status(500).json({ error: err.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    await Payment.update(
      { trash: true },
      { where: { id: req.params.id, school_id } }
    );
    res.status(200).json({ message: "Payment soft deleted" });
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
};
const deleteInvoice = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    await Invoice.update(
      { trash: true },
      { where: { id: req.params.id, school_id } }
    );
    res.status(200).json({ message: "Invoice soft deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const restoreInvoice = async (req, res) => {
  try {
    await Invoice.update({ trash: false }, { where: { id: req.params.id } });
    res.status(200).json({ message: "Invoice restored" });
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
};
const createLeaveRequest = async (req, res) => {
  try {
    const school_id = req.user.school_id;
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
    if (
      !school_id ||
      !user_id ||
      !student_id ||
      !from_date ||
      !to_date ||
      !leave_type ||
      !reason
    ) {
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
      // status: status ? status : "pending",
      // admin_remarks,
      // approved_by: userId ? userId : null,
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Failed to update leave request" });
  }
};
const leaveRequestPermission = async (req, res) => {
  try {
    const Id = req.params.id;
    const school_id = req.user.school_id;
    const status = req.query.status;
    const userId = req.query.user_id;
    const admin_remarks = req.query.admin_remarks;
    if (!userId || !status) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const leaveRequest = await LeaveRequest.findOne({
      where: { id: Id, trash: false, school_id: school_id },
    });
    if (!leaveRequest) return res.status(404).json({ error: "Not found" });

    leaveRequest.approved_by = userId;
    leaveRequest.admin_remarks = admin_remarks;
    if (status === "approved") {
      leaveRequest.status = "approved";
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
    res.status(200).json("Successfully deleted");
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Failed to delete leave request" });
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
    console.error("Restore Error:", error);
    res.status(500).json({ error: "Failed to restore leave request" });
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
    console.error("Fetch All Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};
//i want to get teachers leave request status approved
const getApprovedStaffLeaveRequests = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      school_id: school_id,
      role: "staff",
      status: "approved",
    };
    const { count, rows: leaveRequests } = await LeaveRequest.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp"],
          // include: [
          //   {
          //     model: Timetable,
          //     attributes: ["id", "class_id", "section_id", "subject_id"],
          //   },
          // ],
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
    console.error("Fetch All Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};
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
    let fileName = null;
    if (req.files?.file?.[0]) {
      fileName = req.files.file[0];
      const uploadPath = "uploads/news_files/";
      fileName = await compressAndSaveFile(fileName, uploadPath);
    }

    const news = await News.create({
      school_id,
      title,
      content,
      date,
      user_id,

      file: fileName ? fileName : null,
    });

    if (req.files?.images) {
      const imageRecords = [];

      for (const img of req.files.images) {
        const compressedName = await compressAndSaveFile(
          img,
          "uploads/news_images/"
        );
        imageRecords.push({
          news_id: news.id,
          image_url: compressedName,
        });
      }

      await NewsImage.bulkCreate(imageRecords);
    }
    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllNews = async (req, res) => {
  try {
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
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      news,
    });
  } catch (error) {
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
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};

const updateNews = async (req, res) => {
  const { id } = req.params;
  const school_id = req.user.school_id;
  const { title, content, file } = req.body;
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
  let fileName = news.file;
  if (req.file) {
    const uploadPath = "uploads/news_files/";
    fileName = await compressAndSaveFile(req.file, uploadPath);
  }
  await news.update({ title, content, file: fileName });

  if (req.files?.images) {
    const imageRecords = [];

    for (const img of req.files.images) {
      const compressedName = await compressAndSaveFile(
        img,
        "uploads/news_images/"
      );
      imageRecords.push({
        news_id: news.id,
        image_url: compressedName,
      });
    }

    await NewsImage.bulkCreate(imageRecords);
  }
  res.json({ message: "Updated", news });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};
const deleteNewsImage = async (req, res) => {
  try {
    const { id } = req.params;
    const newsImage = await NewsImage.findOne({ where: { id, trash: false } });
    if (!newsImage) return res.status(404).json({ error: "Not found" });
    await newsImage.update({ trash: true });
    res.json({ message: "Soft deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
      const uploadPath = "uploads/notices/";
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
        id: notice.id,
        class_id: cid,
      }));
      await NoticeClass.bulkCreate(mappings);
    }

    res.status(201).json({ message: "Notice created", notice });
  } catch (err) {
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
    const { count, rows: notices } = await Notice.findAndCountAll({
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
          include: [{ model: Class, attributes: ["id", "classname"] }],
          required: false,
        },
      ],
    });
    if (!notice) return res.status(404).json({ error: "Notice not found" });
    res.json(notice);
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
      const uploadPath = "uploads/notices/";
      if (fileName) {
        await deletefilewithfoldername(fileName, uploadPath);
      }
      await deletefilewithfoldername(fileName, uploadPath);
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    await notice.update({ title, content, type, file: fileName });

    if (type === "classes") {
      await NoticeClass.destroy({ where: { id: id } });
      const mappings = class_ids.map((cid) => ({
        id: id,
        class_id: cid,
      }));
      await NoticeClass.bulkCreate(mappings);
    }

    res.json({ message: "Notice updated" });
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
};
const getLatestNotices = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
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
    console.error("Error fetching notices:", error);
    res.status(500).json({ error: "Failed to fetch notices" });
  }
};
const bulkUpsertTimetable = async (req, res) => {
  try {
    const { records } = req.body;
    // records = [ { school_id, class_id, day_of_week, period_number, subject_id, staff_id }, ... ]

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: "Invalid records format" });
    }

    // Use bulkCreate with updateOnDuplicate
    await Timetable.bulkCreate(records, {
      updateOnDuplicate: ["subject_id", "staff_id", "updatedAt"],
    });

    return res.json({
      success: true,
      message: "Timetable updated successfully",
    });
  } catch (error) {
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
    // if (searchQuery) {
    //   whereClause[Op.or] = [
    //     { class_name: { [Op.like]: `%${searchQuery}%` } },
    //     { subject_name: { [Op.like]: `%${searchQuery}%` } },
    //     { name: { [Op.like]: `%${searchQuery}%` } },
    //   ];
    // }
    const { count, rows: timetable } = await Timetable.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Class,
          attributes: ["classname"],
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
    console.error("Delete Timetable Entry Error:", error);
    res.status(500).json({ error: "Failed to delete timetable entry" });
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
    // 1. Get all staff in the school
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
      (staff) => !assignedIds.includes(staff.id)
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
    // i want check the sub_staff_id is allready assigned to other class at the same period
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

    // Check for existing substitution
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

      // Check if substitute is already assigned in same period
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

      // Check if substitution already exists
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
      }
    );
    res.json({ message: "Substitution updated", updated });
  } catch (err) {
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
    //default today
    const date = req.query.date || new Date().toISOString().split("T")[0];
    if (!school_id || !date) {
      return res.status(400).json({ error: "school_id and date are required" });
    }

    // Fetch attendance + markings
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

    // Group by class_id
    const classSummary = {};
    for (const rec of records) {
      const classId = rec.class_id;
      //i want total studnet count the class id used student table
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
        (m) => m.status === "present"
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
    console.error("Error in getSchoolAttendanceSummary:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassesByYear,

  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,

  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  restoredStaff,
  updateStaffUser,

  createGuardian,
  getAllGuardians,
  getGuardianById,
  updateGuardian,
  createGuardianService,
  deleteGuardian,

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
  restoreDuty,
  permanentDeleteDuty,
  updateDutyAssigned,
  bulkUpdateDutyAssignments,

  createAchievementWithStudents,
  getAllAchievements,
  getAchievementById,
  updateAchievement,
  deleteAchievement,
  restoreAchievement,
  updateStudentAchievement,

  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  restoreEvent,

  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  restorePayment,

  createInvoice,
  addInvoiceStudentsbyInvoiceId,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  restoreInvoice,
  permanentDeleteInvoiceStudent,

  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  leaveRequestPermission,
  deleteLeaveRequest,
  restoreLeaveRequest,
  getAllStaffLeaveRequests,
  getAllStudentLeaveRequests,

  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
  restoreNews,
  deleteNewsImage,

  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
  restoreNotice,
  getLatestNotices,

  bulkUpsertTimetable,
  getAllTimetables,
  getTimetableById,
  deleteTimetableEntry,
  getFreeStaffForPeriod,

  createSubstitution,
  bulkCreateSubstitution,
  getAllSubstitutions,
  getSubstitutionById,
  updateSubstitution,
  deleteSubstitution,

  getSchoolAttendanceSummary,
};
