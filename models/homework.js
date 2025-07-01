"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const HomeworkAssignment = require("./homeworkassignment");
const Class = require("./class");
const Subject = require("./subject");
const School = require("./school");

const Homework = schoolSequelize.define(
  "Homework",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    school_id: DataTypes.INTEGER,
    teacher_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    subject_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    due_date: DataTypes.DATEONLY,
    file: DataTypes.STRING,
    type: {
      type: DataTypes.ENUM("online", "offline"),
      allowNull: false,
    },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "homeworks",
    timestamps: true,
  }
);

module.exports = Homework;
