"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const AttendanceMarked = schoolSequelize.define(
  "AttendanceMarked",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    attendance_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("present", "absent", "late", "leave"),
      allowNull: false,
    },
    remarks: { type: DataTypes.TEXT },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "attendance_marked",
    timestamps: false,
  }
);

module.exports = AttendanceMarked;
