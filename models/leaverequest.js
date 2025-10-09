"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const LeaveRequest = schoolSequelize.define(
  "LeaveRequest",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    school_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: true },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    role: { type: DataTypes.ENUM("student", "staff"), defaultValue: "student" },
    reason: { type: DataTypes.TEXT, allowNull: false },
    leave_type: {
      type: DataTypes.ENUM("sick", "casual", "emergency", "vacation", "other"),
      defaultValue: "other",
    },
    leave_duration: {
      type: DataTypes.ENUM("half", "full"),
      defaultValue: "full",
    },
    half_section: {
      type: DataTypes.ENUM("fornoon", "afternoon"),
      allowNull: true,
    },
    from_date: { type: DataTypes.DATEONLY, allowNull: false },
    to_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    admin_remarks: { type: DataTypes.TEXT, allowNull: true },
    attachment: { type: DataTypes.STRING, allowNull: true },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "leave_requests",
    timestamps: true,
  }
);

module.exports = LeaveRequest;
