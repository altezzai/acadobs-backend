"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const Homework = require("./homework");
const Student = require("./student");
const HomeworkAssignment = schoolSequelize.define(
  "HomeworkAssignment",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    homework_id: DataTypes.INTEGER,
    student_id: DataTypes.INTEGER,
    remarks: DataTypes.STRING,
    points: { type: DataTypes.INTEGER, defaultValue: 0 },
    solved_file: DataTypes.STRING,
  },
  {
    tableName: "homework_assignments",
    timestamps: true,
  }
);

module.exports = HomeworkAssignment;
