const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { compressAndSaveFile } = require("../utils/fileHandler");
const Staff = require("../models/staff");
const Class = require("../models/class");
const Subject = require("../models/subject");
const User = require("../models/user");
const Guardian = require("../models/guardian");
const Student = require("../models/student");

// CREATE
const createClass = async (req, res) => {
  try {
    const { year, division, classname, school_id } = req.body;
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
    console.log(req.file);
    // // const dp = req.file ? req.file.filename : null;
    // const dp = req.file ? `/uploads/dp/${req.file.filename}` : null;
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
const restoredStaffUser = async (req, res) => {
  try {
    const { staff_id } = req.params;
    const user = await User.findByPk();
    if (user && !user.trash)
      return res.status(404).json({ error: "user not found" });

    await user.update({ trash: false });
    res.status(200).json({ message: "successfully restored user " });
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

    if (
      !guardian_name ||
      !guardian_email ||
      !guardian_contact ||
      !full_name ||
      !reg_no ||
      !class_id
    ) {
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

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,

  createSubject,
  getSubjects,
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
};
