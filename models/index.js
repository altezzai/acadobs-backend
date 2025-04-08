const Homework = require("./homework");
const HomeworkAssignment = require("./homeworkassignment");
const Student = require("./student");
const Class = require("./class");
const Subject = require("./subject");
const School = require("./school");
const InternalExam = require("./internal_exams");
const Mark = require("./marks");

// Associations
Homework.hasMany(HomeworkAssignment, { foreignKey: "homework_id" });
Homework.belongsTo(Class, { foreignKey: "class_id" });
Homework.belongsTo(Subject, { foreignKey: "subject_id" });
Homework.belongsTo(School, { foreignKey: "school_id" });

HomeworkAssignment.belongsTo(Homework, { foreignKey: "homework_id" });
HomeworkAssignment.belongsTo(Student, { foreignKey: "student_id" });

InternalExam.hasMany(Mark, { foreignKey: "internal_id" });
InternalExam.belongsTo(Class, { foreignKey: "class_id" });
InternalExam.belongsTo(Subject, { foreignKey: "subject_id" });
InternalExam.belongsTo(School, { foreignKey: "school_id" });

Mark.belongsTo(Student, { foreignKey: "student_id" });

module.exports = {
  Homework,
  HomeworkAssignment,
  Student,
  Class,
  Subject,
  School,
  InternalExam,
  Mark,
};
