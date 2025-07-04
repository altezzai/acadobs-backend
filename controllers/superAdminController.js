const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const School = require("../models/school");
const User = require("../models/user");
const Class = require("../models/class");
const Subject = require("../models/subject");
const { compressAndSaveFile } = require("../utils/fileHandler");
const { Op } = require("sequelize");

const createSchool = async (req, res) => {
  try {
    const { name, email, phone, address, admin_password, period_count } =
      req.body;
    if (!name || !email || !phone || !admin_password) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    const existingUser = await User.findOne({
      where: { email: email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "SchoolAdmin email already exists in user table" });
    }
    // const logo = req.file ? `/uploads/${req.file.filename}` : null;
    let fileName = null;

    if (req.file) {
      const uploadPath = "uploads/school_logos/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    const school = await School.create({
      name,
      email,
      phone,
      address,
      period_count,
      logo: fileName,
    });

    const hashedPassword = await bcrypt.hash(admin_password, 10);

    await User.create({
      name: name,
      email: email,
      phone,
      password: hashedPassword,
      school_id: school.id,
      dp: fileName,
      role: "admin",
      status: "active",
    });

    res
      .status(201)
      .json({ message: "School and admin created successfully", school });
  } catch (error) {
    console.error("Create school error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllSchools = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: schools } = await School.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        name: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      schools,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, status, period_count } = req.body;

    const school = await School.findByPk(id);
    if (!school) return res.status(404).json({ error: "School not found" });

    let fileName = null;

    if (req.file) {
      const uploadPath = "uploads/school_logos/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    await school.update({
      name,
      email,
      phone,
      address,
      period_count,
      logo: fileName ? fileName : school.logo,
      status,
    });

    res.status(200).json({ message: "School updated successfully", school });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findByPk(id);
    if (!school) return res.status(404).json({ error: "School not found" });

    await school.update({ trash: true });

    res
      .status(200)
      .json({ message: "School deleted successfully (soft delete)" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const createClass = async (req, res) => {
  try {
    const { year, division, classname } = req.body;
    if (!year || !division || !classname) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    const existingClass = await Class.findOne({
      where: {
        year,
        division,
        classname,

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
    const classData = await Class.findByPk(id);
    if (!classData) return res.status(404).json({ message: "Class not found" });
    const existingClass = await Class.findOne({
      where: {
        year,
        division,
        classname,

        id: { [Op.ne]: id },
        trash: false,
      },
    });

    if (existingClass) {
      return res.status(409).json({
        message:
          "Class with same year, division, and name already exists in this school.",
      });
    }
    await classData.update({ year, division, classname }, { where: { id } });
    res.status(200).json({ message: "Class updated", classData });
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
    const { subject_name, class_range } = req.body;
    if (!subject_name || !class_range) {
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
      where: { subject_name, class_range, trash: false },
    });

    if (exists) {
      return res.status(400).json({
        error: "Subject already exists for the same class range and school.",
      });
    }

    const subject = await Subject.create({
      subject_name,
      class_range,
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
    const { subject_name, class_range } = req.body;

    const exists = await Subject.findOne({
      where: {
        subject_name,
        class_range,

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

    await subject.update({ subject_name, class_range });
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
module.exports = {
  createSchool,
  getAllSchools,
  updateSchool,
  deleteSchool,

  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,

  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
