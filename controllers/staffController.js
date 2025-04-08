const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { compressAndSaveFile } = require("../utils/fileHandler");
// const Mark = require("../models/marks");
// const InternalExam = require("../models/internal_exams");
const School = require("../models/school");
const Class = require("../models/class");
const Subject = require("../models/subject");
const Student = require("../models/student");

const {
  Homework,
  HomeworkAssignment,
  InternalExam,
  Mark,
} = require("../models");
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
      include: [
        {
          model: Mark,
          attributes: ["id", "marks_obtained"],
          include: [{ model: Student, attributes: ["id", "full_name"] }],
        },
        { model: School, attributes: ["id", "name"] },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
      ],
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

const createHomeworkWithAssignments = async (req, res) => {
  try {
    const {
      school_id,
      teacher_id,
      class_id,
      subject_id,
      description,
      due_date,
      assignments,
    } = req.body;

    if (!school_id || !teacher_id || !class_id || !subject_id || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/homeworks/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    // Check for existing homework with matching criteria
    const existingHomework = await Homework.findOne({
      where: {
        school_id: 1,
        teacher_id,
        class_id,
        subject_id,
        description,
        due_date,
      },
    });

    if (existingHomework) {
      return res.status(200).json({
        message: "Homework already exists",
        homework: existingHomework,
      });
    }

    const homework = await Homework.create({
      school_id,
      teacher_id,
      class_id,
      subject_id,
      description,
      due_date,
      file: fileName ? fileName : null,
    });

    const assignmentData = assignments.map((a) => ({
      ...a,
      homework_id: homework.id,
    }));

    await HomeworkAssignment.bulkCreate(assignmentData);

    res.status(201).json({
      message: "Homework and assignments created",
      homework,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
const getAllHomework = async (req, res) => {
  try {
    const homework = await Homework.findAll({
      include: [
        {
          model: HomeworkAssignment,
          attributes: ["id", "status", "points", "solved_file"],

          include: [
            {
              model: Student,
              attributes: ["id", "reg_no", "full_name", "image"],
            },
          ],

          // include: [
          //   {
          //     model: Student,
          //     // attributes: ["id", "reg_no", "full_name", "image"],
          //   },
          // ],
        },
      ],
    });
    // const homework = await Homework.findAll({
    //   include: [
    //     {
    //       model: HomeworkAssignment,
    //     },
    //   ],
    // });
    res.status(200).json(homework);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
const getHomeworkById = async (req, res) => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id, {
      include: [
        {
          model: HomeworkAssignment,
          attributes: ["id", "status", "points", "solved_file"],

          include: [
            {
              model: Student,
              attributes: ["id", "reg_no", "full_name", "image"],
            },
          ],
        },
      ],
    });
    if (!homework) return res.status(404).json({ error: "Not found" });
    res.status(200).json(homework);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
const updateHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, due_date } = req.body;
    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/homeworks/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    const homework = await Homework.findByPk(id);
    if (!homework) return res.status(404).json({ error: "Not found" });

    await homework.update({
      description,
      due_date,
      file: fileName ? fileName : homework.file,
    });
    res.status(200).json({ message: "Updated successfully", homework });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updateHomeworkAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, points } = req.body;

    const assignment = await HomeworkAssignment.findByPk(id);
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

// DELETE
const deleteHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id);
    if (!homework || homework.trash)
      return res.status(404).json({ error: "Not found" });

    await Homework.update({ trash: true }, { where: { id: id } });
    res.status(200).json({
      message: `Deleted successfully,'description : ${homework.description}'.`,
    });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};
const permentDeleteHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id);
    if (!homework || homework.trash)
      return res.status(404).json({ error: "Not found" });

    if (!homework) return res.status(404).json({ error: "Not found" });

    await HomeworkAssignment.destroy({ where: { homework_id: id } });
    await homework.destroy();

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const restoreHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id);
    if (!homework) return res.status(404).json({ error: "Not found" });

    await Homework.update({ trash: false }, { where: { id: id } });

    res.json({
      message: `restored 'description : ${homework.description}'`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const bulkUpdateHomeworkAssignments = async (req, res) => {
  try {
    const { homework_id, updates } = req.body;

    if (!homework_id || !Array.isArray(updates)) {
      return res
        .status(400)
        .json({ error: "homework_id and updates array are required" });
    }

    const updatePromises = updates.map(async (item) => {
      return HomeworkAssignment.update(
        {
          status: item.status,
          points: item.points,
        },
        {
          where: {
            homework_id,
            student_id: item.student_id,
          },
        }
      );
    });

    await Promise.all(updatePromises);

    res
      .status(200)
      .json({ message: "Homework assignments updated successfully" });
  } catch (error) {
    console.error("Bulk update failed:", error);
    res.status(500).json({ error: "Bulk update failed" });
  }
};

module.exports = {
  createExamWithMarks,
  getAllExams,
  updateExam,
  updateMark,
  getAllmarks,
  deleteExam,

  createHomeworkWithAssignments,
  getAllHomework,
  getHomeworkById,
  updateHomework,
  deleteHomework,
  restoreHomework,
  updateHomeworkAssignment,
  permentDeleteHomework,
  bulkUpdateHomeworkAssignments,
};
