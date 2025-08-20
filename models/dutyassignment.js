"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const DutyAssignment = schoolSequelize.define(
  "DutyAssignment",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    staff_id: { type: DataTypes.INTEGER, allowNull: false },
    duty_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed"),
      defaultValue: "pending",
    },
    remarks: { type: DataTypes.TEXT },
    solved_file: { type: DataTypes.STRING },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "duty_assignments",
    timestamps: true,
  }
);

module.exports = DutyAssignment;
