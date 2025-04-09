const Homework = require("./homework");
const HomeworkAssignment = require("./homeworkassignment");
const Student = require("./student");
const Class = require("./class");
const Subject = require("./subject");
const School = require("./school");
const InternalExam = require("./internal_exams");
const Mark = require("./marks");
const User = require("./user");
const Guardian = require("./guardian");
const Staff = require("./staff");
const Attendance = require("./attendance");
const AttendanceMarked = require("./attendancemarked");
// Relations

// Associations
Homework.hasMany(HomeworkAssignment, { foreignKey: "homework_id" });
Homework.belongsTo(Class, { foreignKey: "class_id" });
Homework.belongsTo(Subject, { foreignKey: "subject_id" });
Homework.belongsTo(School, { foreignKey: "school_id" });
Homework.belongsTo(User, { foreignKey: "teacher_id" });

HomeworkAssignment.belongsTo(Homework, { foreignKey: "homework_id" });
HomeworkAssignment.belongsTo(Student, { foreignKey: "student_id" });

Attendance.hasMany(AttendanceMarked, { foreignKey: "attendance_id" });
Attendance.belongsTo(Class, { foreignKey: "class_id" });
Attendance.belongsTo(Subject, { foreignKey: "subject_id" });
Attendance.belongsTo(School, { foreignKey: "school_id" });
Attendance.belongsTo(User, { foreignKey: "teacher_id" });

AttendanceMarked.belongsTo(Attendance, { foreignKey: "attendance_id" });
AttendanceMarked.belongsTo(Student, { foreignKey: "student_id" });

Staff.belongsTo(User, { foreignKey: "user_id" });
Guardian.belongsTo(User, { foreignKey: "user_id" });

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
