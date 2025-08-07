"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const Student = require("./student");
const Mark = schoolSequelize.define(
  "Mark",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    internal_id: DataTypes.INTEGER,
    student_id: DataTypes.INTEGER,
    marks_obtained: DataTypes.DECIMAL(5, 2),
    status: {
      type: DataTypes.ENUM("absent", "present"),
      defaultValue: "absent",
    },
  },
  {
    tableName: "marks",
    timestamps: true,
  }
);

module.exports = Mark;
