const bcrypt = require("bcrypt");
const logger = require("../utils/logger");
const School = require("../models/school");
const User = require("../models/user");
const Class = require("../models/class");
const Subject = require("../models/subject");
const AccountDelete = require("../models/accountdelete");
const Syllabus = require("../models/syllabus");
const {
  compressAndSaveFile,
  deletefilewithfoldername,
} = require("../utils/fileHandler");
const { Op } = require("sequelize");

const createSchool = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      admin_password,
      period_count,
      syllabus_id,
      attendance_count,
      education_year_start,
      location,
      pass_percent,
      primary_colour,
      secondary_colour,
    } = req.body;
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
    let fileName = null;
    if (req.files?.logo) {
      const uploadPath = "uploads/school_logos/";
      fileName = await compressAndSaveFile(req.files.logo[0], uploadPath);
    }

    let bgImageFileName = null;
    if (req.files?.image) {
      const uploadPath = "uploads/school_image/";
      bgImageFileName = await compressAndSaveFile(
        req.files.image[0],
        uploadPath
      );
    }

    const school = await School.create({
      name,
      email,
      phone,
      address,
      period_count,
      logo: fileName,
      syllabus_id,
      attendance_count,
      education_year_start,
      location,
      pass_percent,
      bg_image: bgImageFileName,
      primary_colour,
      secondary_colour,
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
    logger.error("Create school error:", error);
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
    logger.error("Error getting schools:", error);
    res.status(500).json({ error: error.message });
  }
};
const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findByPk(id);
    if (!school) return res.status(404).json({ error: "School not found" });
    res.status(200).json({ school });
  } catch (error) {
    logger.error("Error getting school by ID:", error);
    res.status(500).json({ error: error.message });
  }
};
const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      status,
      period_count,
      syllabus_id,
      attendance_count,
      education_year_start,
      location,
      pass_percent,
      primary_colour,
      secondary_colour,
    } = req.body;

    const school = await School.findByPk(id);
    if (!school) return res.status(404).json({ error: "School not found" });

    let fileName = school.logo;
    if (req.files?.logo) {
      const uploadPath = "uploads/school_logos/";
      fileName = await compressAndSaveFile(req.files.logo[0], uploadPath);
      const oldFileName = school.logo;
      if (oldFileName) {
        await deletefilewithfoldername(oldFileName, uploadPath);
      }
    }

    let bgImageFileName = school.bg_image;
    if (req.files?.image) {
      const uploadPath = "uploads/school_image/";
      bgImageFileName = await compressAndSaveFile(
        req.files.image[0],
        uploadPath
      );
      const oldFileName = school.bg_image;
      if (oldFileName) {
        await deletefilewithfoldername(oldFileName, uploadPath);
      }
    }
    await school.update({
      name,
      email,
      phone,
      address,
      period_count,
      logo: fileName,
      status,
      syllabus_id,
      attendance_count,
      education_year_start,
      location,
      pass_percent,
      bg_image: bgImageFileName,
      primary_colour,
      secondary_colour,
    });

    res.status(200).json({ message: "School updated successfully", school });
  } catch (error) {
    logger.error("Error updating school:", error);
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
    logger.error("Error deleting school:", error);
    res.status(500).json({ error: error.message });
  }
};
const restoreSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findByPk(id);
    if (!school) return res.status(404).json({ error: "School not found" });

    await school.update({ trash: false });

    res.status(200).json({ message: "School restored successfully" });
  } catch (error) {
    logger.error("Error restoring school:", error);
    res.status(500).json({ error: error.message });
  }
};
const permanentlyDeleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findByPk(id);
    if (!school) return res.status(404).json({ error: "School not found" });

    await school.destroy();
    res.status(200).json({ message: "School deleted permanently" });
  } catch (error) {
    logger.error("Error permanently deleting school:", error);
    res.status(500).json({ error: error.message });
  }
};
const getTrashedSchools = async (req, res) => {
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
        trash: true,
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
    logger.error("Error getting trashed schools:", error);
    res.status(500).json({ error: error.message });
  }
};
const createClass = async (req, res) => {
  try {
    const { year, division, classname, school_id } = req.body;
    if (!year || !division || !classname) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    const existingClass = await Class.findOne({
      where: {
        year,
        division,
        classname,
        school_id: school_id ? school_id : { [Op.ne]: null },

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
    logger.error("Error creating class:", err);
    console.error("Error creating class:", err);
    res.status(500).json({ error: err.message });
  }
};

const getAllClasses = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const year = req.query.year || "";
    const division = req.query.division || "";
    const school_id = req.query.school_id || "";
    const trash = req.query.trash || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause = {};

    if (searchQuery) {
      whereClause.classname = { [Op.like]: `%${searchQuery}%` };
    }
    if (year) {
      whereClause.year = year;
    }
    if (division) {
      whereClause.division = division;
    }
    if (school_id) {
      whereClause.school_id = school_id;
    }
    if (trash) {
      whereClause.trash = trash;
    }

    const { count, rows: classes } = await Class.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      order: [["id", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      classes,
    });
  } catch (err) {
    logger.error("Error getting classes:", err);
    res.status(500).json({ error: err.message });
  }
};

const getClassById = async (req, res) => {
  try {
    const id = req.params.id;
    const classData = await Class.findByPk(id);
    if (!classData) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(classData);
  } catch (err) {
    logger.error("Error fetching class:", err);
    res.status(500).json({ error: err.message });
  }
};

const updateClass = async (req, res) => {
  try {
    const id = req.params.id;
    const { year, division, classname, school_id } = req.body;
    const classData = await Class.findByPk(id);
    if (!classData) return res.status(404).json({ message: "Class not found" });
    const existingClass = await Class.findOne({
      where: {
        year,
        division,
        classname,
        school_id,

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
    await classData.update(
      { year, division, classname, school_id },
      { where: { id } }
    );
    res.status(200).json({ message: "Class updated", classData });
  } catch (err) {
    logger.error("Error updating class:", err);
    res.status(500).json({ error: err.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const id = req.params.id;
    await Class.update({ trash: true }, { where: { id } });
    res.status(200).json({ message: "Class soft-deleted" });
  } catch (err) {
    logger.error("Error deleting class:", err);
    res.status(500).json({ error: err.message });
  }
};
const restoreClass = async (req, res) => {
  try {
    const id = req.params.id;
    await Class.update({ trash: false }, { where: { id } });
    res.status(200).json({ message: "Class restored" });
  } catch (err) {
    logger.error("Error restoring class:", err);
    res.status(500).json({ error: err.message });
  }
};
const permanentDeleteClass = async (req, res) => {
  try {
    const id = req.params.id;
    await Class.destroy({ where: { id } });
    res.status(200).json({ message: "Class permanently deleted" });
  } catch (err) {
    logger.error("Error permanently deleting class:", err);
    res.status(500).json({ error: err.message });
  }
};
const getTrashedClasses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { count, rows: classes } = await Class.findAndCountAll({
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
      classes,
    });
  } catch (err) {
    logger.error("Error getting trashed classes:", err);
    res.status(500).json({ error: err.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const school_id = req.body.school_id || null;
    const { subject_name, class_range, syllabus_id } = req.body;
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
      where: {
        subject_name,
        class_range,
        trash: false,
        syllabus_id,
        school_id,
      },
    });

    if (exists) {
      return res.status(400).json({
        error: "Subject already exists for the same class range and school.",
      });
    }

    const subject = await Subject.create({
      subject_name,
      class_range,
      syllabus_id,
      school_id: school_id ? school_id : null,
    });
    res.status(201).json(subject);
  } catch (err) {
    logger.error("Error creating subject:", err);
    res.status(500).json({ error: err.message });
  }
};

const getSubjects = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const syllabus_id = req.query.syllabus_id || "";
    const range = req.query.range || "";
    const school_id = req.query.school_id || "";
    const trash = req.query.trash || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause = {};

    if (searchQuery) {
      whereClause.subject_name = { [Op.like]: `%${searchQuery}%` };
    }
    if (syllabus_id) {
      whereClause.syllabus_id = syllabus_id;
    }
    if (range) {
      whereClause.class_range = range;
    }
    if (school_id) {
      whereClause.school_id = school_id;
    }
    if (trash) {
      whereClause.trash = trash;
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
    logger.error("Error getting subjects:", err);
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
    logger.error("Error getting subject by id:", err);
    res.status(500).json({ error: err.message });
  }
};
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_name, class_range, syllabus_id } = req.body;

    const exists = await Subject.findOne({
      where: {
        subject_name,
        class_range,
        syllabus_id,

        id: { [require("sequelize").Op.ne]: id },
        trash: false,
      },
    });

    if (exists) {
      return res.status(400).json({
        error: "Another subject with the same details already exists.",
      });
    }

    const subject = await Subject.findOne({
      where: { id },
      include: [
        {
          model: Syllabus,
          attributes: ["name"],
        },
      ],
    });
    if (!subject || subject.trash)
      return res.status(404).json({ error: "Subject not found" });

    await subject.update({ subject_name, class_range, syllabus_id });
    res.status(200).json(subject);
  } catch (err) {
    logger.error("Error updating subject:", err);
    res.status(500).json({ error: err.message });
  }
};

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
    logger.error("Error deleting subject:", err);
    res.status(500).json({ error: err.message });
  }
};
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
    logger.error("Error restoring subject:", err);
    res.status(500).json({ error: err.message });
  }
};
const getTrashedSubjects = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const syllabus_id = req.query.syllabus_id || "";
    const range = req.query.range || "";
    const school_id = req.query.school_id || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause = {};

    if (searchQuery) {
      whereClause.subject_name = { [Op.like]: `%${searchQuery}%` };
    }
    if (syllabus_id) {
      whereClause.syllabus_id = syllabus_id;
    }
    if (range) {
      whereClause.class_range = range;
    }
    if (school_id) {
      whereClause.school_id = school_id;
    }

    const { count, rows: subjects } = await Subject.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { ...whereClause, trash: true },
      include: [
        {
          model: Syllabus,
          attributes: ["name"],
        },
      ],
      order: [["id", "DESC"]],
    });
    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      subjects,
    });
  } catch (err) {
    logger.error("Error getting trashed subjects:", err);
    res.status(500).json({ error: err.message });
  }
};
const permanentlyDeleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject || !subject.trash)
      return res.status(404).json({ error: "Subject not found" });

    await subject.destroy();
    res.status(200).json({ message: "Subject permanently deleted" });
  } catch (err) {
    logger.error("Error permanently deleting subject:", err);
    res.status(500).json({ error: err.message });
  }
};
const getAccountDeleteRequests = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || "";
    const reason = req.query.reason || "";
    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }
    if (reason) {
      whereClause.reason = { [Op.like]: `%${reason}%` };
    }

    const { count, rows: requests } = await AccountDelete.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          where: {
            [Op.or]: [
              { name: { [Op.like]: `%${searchQuery}%` } },
              { email: { [Op.like]: `%${searchQuery}%` } },
            ],
          },
        },
      ],
      order: [["createdAt", "DESC"]],

      offset,
      distinct: true,
      limit,
    });
    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      requests,
    });
  } catch (err) {
    logger.error("Error getting account delete requests:", err);
    res.status(500).json({ error: err.message });
  }
};
const updateAccountDeleteRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const request = await AccountDelete.findByPk(id);
    if (!request) {
      return res.status(404).json({ error: "Delete request not found" });
    }
    await request.update({ status, reason });
    res.status(200).json({ message: "Request status updated", request });
  } catch (err) {
    logger.error("Error updating account delete request:", err);
    res.status(500).json({ error: err.message });
  }
};

//syllabus management functions can be added here
const createSyllabus = async (req, res) => {
  try {
    const { name, description, level, country } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Syllabus name is required" });
    }
    const syllabus = await Syllabus.create({
      name,
      description,
      level,
      country,
    });
    res.status(201).json(syllabus);
  } catch (err) {
    logger.error("Error creating syllabus:", err);
    res.status(500).json({ error: err.message });
  }
};
const getSyllabuses = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { count, rows: syllabuses } = await Syllabus.findAndCountAll({
      where: {
        name: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },
      offset,
      distinct: true,
      limit,
    });
    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      syllabuses,
    });
  } catch (err) {
    logger.error("Error getting syllabuses:", err);
    res.status(500).json({ error: err.message });
  }
};
const getSyllabusById = async (req, res) => {
  try {
    const id = req.params.id;
    const syllabus = await Syllabus.findByPk(id);
    if (!syllabus || syllabus.trash) {
      return res.status(404).json({ error: "Syllabus not found" });
    }
    res.status(200).json(syllabus);
  } catch (err) {
    logger.error("Error getting syllabus by ID:", err);
    res.status(500).json({ error: err.message });
  }
};
const updateSyllabus = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, level, country } = req.body;
    const syllabus = await Syllabus.findByPk(id);
    if (!syllabus || syllabus.trash) {
      return res.status(404).json({ error: "Syllabus not found" });
    }
    await syllabus.update({ name, description, level, country });
    res.status(200).json(syllabus);
  } catch (err) {
    logger.error("Error updating syllabus:", err);
    res.status(500).json({ error: err.message });
  }
};
const deleteSyllabus = async (req, res) => {
  try {
    const { id } = req.params;
    const syllabus = await Syllabus.findByPk(id);
    if (!syllabus || syllabus.trash) {
      return res.status(404).json({ error: "Syllabus not found" });
    }
    syllabus.trash = true;
    await syllabus.save();
    res.status(200).json({ message: "Syllabus deleted (soft)" });
  } catch (err) {
    logger.error("Error deleting syllabus:", err);
    res.status(500).json({ error: err.message });
  }
};
const restoreSyllabus = async (req, res) => {
  try {
    const { id } = req.params;
    const syllabus = await Syllabus.findByPk(id);
    if (!syllabus) {
      return res.status(404).json({ error: "Syllabus not found" });
    }
    syllabus.trash = false;
    await syllabus.save();
    res.status(200).json({ message: "Syllabus restored successfully" });
  } catch (err) {
    logger.error("Error restoring syllabus:", err);
    res.status(500).json({ error: err.message });
  }
};
const permanentlyDeleteSyllabus = async (req, res) => {
  try {
    const { id } = req.params;
    const syllabus = await Syllabus.findByPk(id);
    if (!syllabus) {
      return res.status(404).json({ error: "Syllabus not found" });
    }
    await syllabus.destroy();
    res.status(200).json({ message: "Syllabus deleted permanently" });
  } catch (err) {
    logger.error("Error permanently deleting syllabus:", err);
    res.status(500).json({ error: err.message });
  }
};
const getTrashedSyllabuses = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { count, rows: trashedSyllabuses } = await Syllabus.findAndCountAll({
      where: {
        name: { [Op.like]: `%${searchQuery}%` },
        trash: true,
      },
      offset,
      distinct: true,
      limit,
    });
    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      trashedSyllabuses,
    });
  } catch (err) {
    logger.error("Error getting trashed syllabuses:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  restoreSchool,
  permanentlyDeleteSchool,
  getTrashedSchools,

  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  restoreClass,
  permanentDeleteClass,
  getTrashedClasses,

  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  restoreSubject,
  permanentlyDeleteSubject,
  getTrashedSubjects,
  getAccountDeleteRequests,
  updateAccountDeleteRequests,

  createSyllabus,
  getSyllabuses,
  getSyllabusById,
  updateSyllabus,
  deleteSyllabus,
  restoreSyllabus,
  permanentlyDeleteSyllabus,
  getTrashedSyllabuses,
};
