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
const Duty = require("./duty");
const DutyAssignment = require("./dutyassignment");
const Achievement = require("./achievement");
const StudentAchievement = require("./studentachievement");
const Payment = require("./payment");
const LeaveRequest = require("./leaverequest");
const News = require("./news");
const NewsImage = require("./newsimage");
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

Duty.hasMany(DutyAssignment, { foreignKey: "duty_id" });
Duty.belongsTo(School, { foreignKey: "school_id" });
DutyAssignment.belongsTo(Duty, { foreignKey: "duty_id" });
DutyAssignment.belongsTo(User, { foreignKey: "staff_id" });

Achievement.hasMany(StudentAchievement, { foreignKey: "achievement_id" });
StudentAchievement.belongsTo(Achievement, { foreignKey: "achievement_id" });
StudentAchievement.belongsTo(Student, { foreignKey: "student_id" });

Student.belongsTo(Class, { foreignKey: "class_id" });
Student.belongsTo(School, { foreignKey: "school_id" });
Student.belongsTo(User, { foreignKey: "guardian_id" });

Payment.belongsTo(School, { foreignKey: "school_id" });
Payment.belongsTo(Student, { foreignKey: "student_id" });

LeaveRequest.belongsTo(School, { foreignKey: "school_id" });
LeaveRequest.belongsTo(User, { foreignKey: "user_id" });
// LeaveRequest.belongsTo(User, { foreignKey: "approved_by" });
LeaveRequest.belongsTo(Student, { foreignKey: "student_id" });

News.belongsTo(School, { foreignKey: "school_id" });
News.belongsTo(User, { foreignKey: "user_id" });
News.hasMany(NewsImage, { foreignKey: "news_id" });
NewsImage.belongsTo(News, { foreignKey: "news_id" });

module.exports = {
  Homework,
  HomeworkAssignment,
  Student,
  Class,
  Subject,
  School,
  InternalExam,
  Mark,
  User,
  Guardian,
  Staff,
  Attendance,
  AttendanceMarked,
  // Duty,
  // DutyAssignment,
};
