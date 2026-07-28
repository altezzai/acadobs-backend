const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const StaffPermission = schoolSequelize.define(
  "StaffPermission",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
     students: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    homeworks: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    attendance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    marks: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
     achievements: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    student_leave_request: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    timetable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    parent_notes: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    leave_request: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
   
    alumni: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    teachers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    teachers_leaveReuest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    teachers_duties: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    teachers_attendance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    staffs: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    staffs_leaveReuest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    staffs_duties: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    staffs_attendance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    events: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    news: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notice: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    exam: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
     chats: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    payments: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reports: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    transportation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    aiAnalytics: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "staff_permissions",
    timestamps: true,
  }
);

module.exports = StaffPermission;
