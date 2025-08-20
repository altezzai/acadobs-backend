"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const InternalExam = schoolSequelize.define(
  "InternalExam",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    school_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    subject_id: DataTypes.INTEGER,
    internal_name: DataTypes.STRING,
    max_marks: DataTypes.DECIMAL(5, 2),
    date: DataTypes.DATEONLY,
    recorded_by: DataTypes.INTEGER,
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "internal_marks",
    timestamps: true,
  }
);

module.exports = InternalExam;
