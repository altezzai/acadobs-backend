"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../../config/connection");

const StudentCoScholasticAssessment = schoolSequelize.define(
  "StudentCoScholasticAssessment",
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
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exam_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    area_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    grade: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    assessed_at: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
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
    tableName: "student_co_scholastic_assessments",
    timestamps: true,
  }
);

module.exports = StudentCoScholasticAssessment;
