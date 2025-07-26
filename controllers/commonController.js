const { Op, where, DATEONLY } = require("sequelize");
const User = require("../models/user");
const Student = require("../models/student");
const { schoolSequelize } = require("../config/connection");
const { Class } = require("../models");

const getStudentsByClassId = async (req, res) => {
  try {
    const { class_id } = req.params;
    const school_id = req.user.school_id || "";
    const searchQuery = req.query.q || "";

    const { count, rows: students } = await Student.findAndCountAll({
      where: {
        class_id,
        school_id,
        full_name: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },
      attributes: ["id", "full_name", "roll_number", "class_id", "image"],
      include: [
        { model: Class, attributes: ["id", "year", "division", "classname"] },
      ],
      order: [["roll_number", "ASC"]],
    });

    res.status(200).json({
      totalcontent: count,
      students,
    });
  } catch (err) {
    console.error("Error fetching students by class ID:", err);
    res.status(500).json({ error: "Failed to fetch students by class ID" });
  }
};

module.exports = {
  getStudentsByClassId,
};
