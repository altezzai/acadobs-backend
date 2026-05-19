"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const StudentTransfer = schoolSequelize.define(
  "StudentTransfer",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    from_school_id: { type: DataTypes.INTEGER, allowNull: false },
    to_school_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    requested_by_role: {
      type: DataTypes.ENUM("guardian", "admin"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      defaultValue: "pending",
    },
    reason: { type: DataTypes.TEXT, allowNull: true },
    admin_remarks: { type: DataTypes.TEXT, allowNull: true },
    reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "student_transfers",
    timestamps: true,
  }
);

module.exports = StudentTransfer;
