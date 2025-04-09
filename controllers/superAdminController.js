const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const School = require("../models/school");
const User = require("../models/user");
const { compressAndSaveFile } = require("../utils/fileHandler");

const createSchool = async (req, res) => {
  try {
    const { name, email, phone, address, admin_password } = req.body;
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

    const { name, email, phone, address, status } = req.body;
    const school = await School.findByPk(id);
    if (!school) return res.status(404).json({ error: "School not found" });

    if (req.file) {
      const uploadPath = "uploads/school_logos/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    await school.update({
      name,
      email,
      phone,
      address,
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

module.exports = {
  createSchool,
  getAllSchools,
  updateSchool,
  deleteSchool,
};
