"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Subject = schoolSequelize.define(
  "Subject",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subject_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class_range: {
      type: DataTypes.ENUM("FS", "PS", "MS", "SS", "common", "other"),
      allowNull: false,
    },
    syllabus_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_multi_teacher: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 11,
    },
    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: "subjects",
    timestamps: true,
  }
);

module.exports = Subject;
