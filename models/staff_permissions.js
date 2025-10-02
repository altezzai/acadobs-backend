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
    homeworks: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    attendance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    timetable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    marks: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    parent_notes: {
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
    leave_request: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    students: {
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
