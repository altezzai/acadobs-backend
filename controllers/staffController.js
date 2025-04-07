const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { compressAndSaveFile } = require("../utils/fileHandler");
const Mark = require("../models/marks");
const InternalExam = require("../models/internal_exams");
const createExamWithMarks = async (req, res) => {
  try {
    const {
      school_id,
      class_id,
      subject_id,
      internal_name,
      max_marks,
      date,
      marks, // array of { student_id, marks_obtained }
    } = req.body;

    const exam = await InternalExam.create({
      school_id,
      class_id,
      subject_id,
      internal_name,
      max_marks,
      date,
    });

    const marksData = marks.map((m) => ({
      internal_id: exam.id,
      student_id: m.student_id,
      marks_obtained: m.marks_obtained,
    }));

    await Mark.bulkCreate(marksData);

    res.status(201).json({ message: "Internal exam and marks created", exam });
  } catch (error) {
    console.error("Error creating exam and marks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllExams = async (req, res) => {
  try {
    const exams = await InternalExam.findAll({
      include: [{ model: Mark, as: "marks" }], // Must match alias exactly
    });

    res.status(200).json(exams);
  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).json({ error: "Failed to fetch exams" });
  }
};
const getAllmarks = async (req, res) => {
  try {
    const exams = await Mark.findAll({
      include: [
        {
          model: InternalExam,
        },
      ],
    });

    res.status(200).json(exams);
  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).json({ error: "Failed to fetch exams" });
  }
};
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await InternalExam.update(req.body, {
      where: { id: id },
    });
    res.status(200).json({ message: "Exam detail updated", updated });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

const updateMark = async (req, res) => {
  try {
    const { mark_id } = req.params;
    const updated = await Mark.update(req.body, {
      where: { id: mark_id },
    });
    res.status(200).json({ message: "mark updated", updated });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    await InternalExam.update({ trash: true }, { where: { id: id } });
    res.status(200).json({ message: "Exam soft-deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};
module.exports = {
  createExamWithMarks,
  getAllExams,
  updateExam,
  updateMark,
  getAllmarks,
  deleteExam,
};
