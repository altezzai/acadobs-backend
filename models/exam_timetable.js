"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const ExamTimetable = schoolSequelize.define(
  "ExamTimetable",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exam_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    standard: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exam_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_marks: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    pass_marks: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("scheduled", "ongoing", "completed", "cancelled","published"),
      allowNull: false,
      defaultValue: "scheduled",
    },
    trash: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
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
    tableName: "exam_timetables",
    timestamps: true,
  }
);

module.exports = ExamTimetable;
