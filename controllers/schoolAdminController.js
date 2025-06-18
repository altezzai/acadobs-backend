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

const { schoolSequelize } = require("../config/connection");
const { create } = require("domain");

// CREATE
const createClass = async (req, res) => {
  try {
    const { year, division, classname, school_id } = req.body;
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
    const classData = await Class.findByPk(id);
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
      { where: { id } }
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
    const { subject_name, class_range, school_id } = req.body;
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
  try {
    const {
      school_id,
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
    // const file = req.file;
    const existingUser = await User.findOne({
      where: { email: email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "SchoolAdmin email already exists in user table" });
    }

    let fileName = null;

    if (req.file) {
      const uploadPath = "uploads/dp/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    const hashedPassword = await bcrypt.hash(phone, 10);
    const user = await User.create({
      name: name,
      email: email,
      phone: phone,
      password: hashedPassword,
      school_id: school_id,
      dp: fileName,
      role: role,
      status: "active",
    });

    const newStaff = await Staff.create({
      school_id,
      user_id: user.id,
      role,
      qualification,
      address,
      class_id,
      subjects,
    });

    res.status(201).json(newStaff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: staff } = await Staff.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        name: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone", "dp"],
        },
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
  try {
    const { staff_id } = req.params;
    const {
      school_id,
      user_id,
      role,
      qualification,
      address,
      class_id,
      subjects,
    } = req.body;

    const staff = await Staff.findByPk(staff_id);
    if (!staff || staff.trash)
      return res.status(404).json({ error: "Staff not found" });

    await staff.update({
      school_id,
      user_id,
      role,
      qualification,
      address,
      class_id,
      subjects,
    });

    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateStaffUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { school_id, name, email, phone, role } = req.body;
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
    let fileName = null;

    if (req.file) {
      const uploadPath = "uploads/dp/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    const user = await User.findOne({
      where: { id: user_id },
    });
    console.log(user);
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
      //   school_id,
    } = req.body;
    if (!guardian_name || !guardian_email || !guardian_contact) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    // const file = req.file;
    const existingUser = await User.findOne({
      where: { email: guardian_email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "SchoolAdmin email already exists in user table" });
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
      school_id: 1,
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
const createGuardianService = async (guardianData, fileBuffer) => {
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
    school_id = 1, // default fallback
  } = guardianData;

  if (!guardian_name || !guardian_email || !guardian_contact) {
    throw new Error("Required guardian fields are missing");
  }

  const existingUser = await User.findOne({
    where: { email: guardian_email },
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
    // res.status(200).json(guardians);
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
    const data = req.body;

    const guardian = await Guardian.findByPk(id);
    if (!guardian) return res.status(404).json({ error: "Guardian not found" });

    await guardian.update(data);
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
    const {
      school_id,
      reg_no,
      full_name,
      date_of_birth,
      gender,
      class_id,
      admission_date,
      status,

      // Guardian Data (all inside req.body)
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
    } = req.body;

    if (!guardian_email || !full_name || !reg_no || !class_id) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    // const file = req.file;
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
    const guardianDpFile = req.files?.dp?.[0]; // guardian image
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
      full_name,
      date_of_birth,
      gender,
      class_id,
      admission_date,
      status,
      image: fileName ? fileName : null,
    });

    res.status(201).json({ success: true, student });
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(500).json({ error: "Failed to create student" });
  }
};
const getAllStudents = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: students } = await Student.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        full_name: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },

      include: [{ model: User, attributes: ["name", "email", "phone", "dp"] }],
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
    const student = await Student.findOne({
      where: { id, trash: false },

      include: [{ model: User, attributes: ["name", "email", "phone", "dp"] }],
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
    const {
      school_id,
      reg_no,
      full_name,
      date_of_birth,
      gender,
      class_id,
      admission_date,
      status,
    } = req.body;
    const existingRegNo = await Student.findOne({
      where: { reg_no, id: { [Op.ne]: id } },
    });

    if (existingRegNo) {
      return res
        .status(400)
        .json({ error: "Reg number already exists in student table" });
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

    await student.update({
      school_id,
      reg_no,
      full_name,
      date_of_birth,
      gender,
      class_id,
      admission_date,
      status,
      image: studentImageFilename,
    });

    res.status(200).json({ message: "Student updated successfully" });
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ error: "Failed to update student" });
  }
};
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);

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
//gete student by class id
const getStudentsByClassId = async (req, res) => {
  try {
    const { class_id } = req.params;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: students } = await Student.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        class_id,
        full_name: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },
      include: [{ model: User, attributes: ["name", "email", "phone", "dp"] }],
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      students,
    });
  } catch (err) {
    console.error("Error fetching students by class ID:", err);
    res.status(500).json({ error: "Failed to fetch students by class ID" });
  }
};
const createDutyWithAssignments = async (req, res) => {
  let uploadPath = null;
  const transaction = await schoolSequelize.transaction();

  try {
    const { school_id, title, description, deadline, assignments } = req.body;
    if (!school_id || !title || !description || !deadline || !assignments) {
      return res.status(400).json({ error: "Missing required fields " });
    }

    const existingDuty = await Duty.findOne({
      where: { title, school_id, deadline },
    });
    if (existingDuty) {
      return res
        .status(400)
        .json({ error: "Duty with the same title already exists" });
    }
    let fileName = null;

    if (req.file) {
      uploadPath = "uploads/duties/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    const duty = await Duty.create(
      {
        school_id,
        title,
        description,
        deadline,
        file: fileName ? fileName : null,
      },
      { transaction }
    );

    const bulkAssignments = assignments.map((item) => ({
      ...item,
      // staff_id: 2,
      duty_id: duty.id,
    }));

    await DutyAssignment.bulkCreate({ bulkAssignments }, { transaction });
    await transaction.commit();
    res.status(201).json({ duty, assignments });
  } catch (err) {
    await deletefilewithfoldername(req.file, uploadPath);
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to create duty with assignments" });
  }
};

const getAllDuties = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const deadline = req.query.deadline || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
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
    const { title, description, deadline, file } = req.body;
    const duty = await Duty.findByPk(req.params.id);
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
  try {
    const { duty_id, updates } = req.body;

    if (!duty_id || !Array.isArray(updates)) {
      return res
        .status(400)
        .json({ error: "duty_id and updates array are required" });
    }

    const updatePromises = updates.map(async (item) => {
      return DutyAssignment.update(
        {
          status: item.status,
          remarks: item.remarks,
        },
        {
          where: {
            duty_id,
            staff_id: item.staff_id,
          },
        }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({ message: "Duty assignments updated successfully" });
  } catch (error) {
    console.error("Bulk update failed:", error);
    res.status(500).json({ error: "Bulk update failed" });
  }
};
const deleteDuty = async (req, res) => {
  try {
    const { id } = req.params;
    const duty = await Duty.findByPk(id);
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
    await DutyAssignment.destroy({ where: { duty_id: id } });
    await Duty.destroy({ where: { id } });
    res.json({ message: "Peremently Deleted Duty" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const createAchievementWithStudents = async (req, res) => {
  try {
    const {
      school_id,
      title,
      description,
      category,
      level,
      date,
      awarding_body,
      recorded_by,
      students,
    } = req.body;

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

    // Handle and compress each student's file
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
const getAllAchievementsBySchoolId = async (req, res) => {
  try {
    const school_id = req.params.id;
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
    const achievement = await Achievement.findByPk(req.params.id, {
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
    await Achievement.update({ trash: true }, { where: { id: req.params.id } });
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
      where: { id: req.params.id },
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
    const { school_id, title, description, date, url, venue } = req.body;

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
    console.log(req.file);
    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/event_files/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    const event = await News.create({
      school_id,
      title,
      content: description,
      date,
      user_id: 1,
      // url,
      // venue,
      file: fileName ? fileName : null,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {};
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
      distinct: true, // Add this line
      limit,
      where: whereClause,
    });

    // const events = await Event.findAll({ where: { trash: false } });
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
    const event = await Event.findByPk(req.params.id);
    if (!event || event.trash)
      return res.status(404).json({ error: "Event not found" });
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { school_id, title, description, date, url, venue } = req.body;
    const Id = req.params.id;
    const existingEvent = await Event.findOne({
      where: { school_id, title, date, id: { [Op.ne]: Id } },
    });

    if (existingEvent) {
      return res
        .status(409)
        .json({ error: "Event with the same title already exists" });
    }

    const event = await Event.findByPk(Id);
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
    await Event.update({ trash: true }, { where: { id: req.params.id } });
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
    const {
      school_id,
      student_id,
      amount,
      payment_date,
      payment_type,
      transaction_id,
    } = req.body;

    if (!school_id || !amount || !payment_date || !payment_type) {
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

    const payment = await Payment.create(req.body);
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {};
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
    const payment = await Payment.findByPk(req.params.id, {
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
    const {
      school_id,
      student_id,
      amount,
      payment_date,
      payment_type,
      transaction_id,
    } = req.body;
    const Id = req.params.id;
    const payment = await Payment.findByPk(Id);
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
    await payment.update(req.body);
    res.status(200).json({ message: "Payment updated", payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    await Payment.update({ trash: true }, { where: { id: req.params.id } });
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
    res.status(500).json({ error: err.message });
  }
};
const createLeaveRequest = async (req, res) => {
  try {
    const {
      school_id,
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
    const { school_id } = req.query;
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
    const { school_id } = req.query;
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
    const userId = req.query.user_id;
    const {
      school_id,
      user_id,
      student_id,
      from_date,
      to_date,
      leave_type,
      reason,
      leave_duration,
      status,
      admin_remarks,
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
    const status = req.query.status;
    const userId = req.query.user_id;
    const admin_remarks = req.query.admin_remarks;
    if (!userId || !status) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const leaveRequest = await LeaveRequest.findOne({
      where: { id: Id, trash: false },
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

    const leave = await LeaveRequest.findOne({
      where: {
        id: id,
        trash: false,
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
const createNews = async (req, res) => {
  try {
    const { school_id, title, content, date } = req.body;

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
    console.log(req.file);
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
      user_id: 1,

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
    // if (images && Array.isArray(images)) {
    //   const imageRecords = images.map((img) => ({
    //     news_id: news.id,
    //     image_url: img.url,
    //   }));
    //   await NewsImage.bulkCreate(imageRecords);
    // }
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
    const news = await News.findOne({
      where: { id: id, trash: false },
      include: [
        {
          model: NewsImage,
          where: { trash: false },
          attributes: ["id", "image_url", "caption"],
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
  const { title, content, file } = req.body;
  const news = await News.findByPk(id);
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
    const news = await News.findByPk(id);
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
    const { school_id, title, content, type, class_ids, date } = req.body;
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
      const { fileName: savedFile } = await compressAndSaveFile(
        req.file,
        uploadPath
      );
      fileName = savedFile;
    }

    const notice = await Notice.create({
      school_id,
      title,
      content,
      file: fileName,
      type,
      date: date ? date : new Date(),
    });

    if (type === "classes" && Array.isArray(class_ids)) {
      const mappings = class_ids.map((cid) => ({
        notice_id: notice.notice_id,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
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
        },
      ],
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
//get notice by id
const getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findOne({
      where: { notice_id: id, trash: false },
      include: [
        {
          model: NoticeClass,
          include: [{ model: Class, attributes: ["id", "classname"] }],
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
    const { title, content, type, class_ids, date } = req.body;
    if (!title || !content || !type) {
      return res.status(400).json({ error: "required fields are missing" });
    }

    const notice = await Notice.findByPk(id);
    const existingNotice = await Notice.findOne({
      where: {
        school_id: notice.school_id,
        title,
        type,
        date,
        notice_id: { [Op.ne]: id },
      },
    }); // Exclude the current notice
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
      await NoticeClass.destroy({ where: { notice_id: id } });
      const mappings = class_ids.map((cid) => ({
        notice_id: id,
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
    const [rows] = await Notice.update(
      { trash: true },
      { where: { notice_id: id } }
    );
    if (!rows) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Notice soft-deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const restoreNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await Notice.update(
      { trash: false },
      { where: { notice_id: id } }
    );
    if (!rows) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Notice restored" });
  } catch (err) {
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
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentsByClassId,

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
  getAllAchievementsBySchoolId,
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

  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  leaveRequestPermission,
  deleteLeaveRequest,
  restoreLeaveRequest,

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
};
