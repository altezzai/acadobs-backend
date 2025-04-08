const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { compressAndSaveFile } = require("../utils/fileHandler");
const HomeworkAssignment = require("../models/homeworkassignment");
const Student = require("../models/student");
const Homework = require("../models/homework");

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
const getHomeworkByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const homework = await HomeworkAssignment.findAll({
      where: { student_id: student_id },
      include: [
        {
          model: Homework,
          attributes: ["id", "description", "due_date", "file"],
        },
      ],
    });
    if (!homework) return res.status(404).json({ error: "Not found" });
    res.status(200).json(homework);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { updateHomeworkAssignment, getHomeworkByStudentId };
