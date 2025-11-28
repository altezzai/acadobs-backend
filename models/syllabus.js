"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Syllabus = schoolSequelize.define(
  "Syllabus",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    level: {
      type: DataTypes.ENUM("School", "College", "University"),
      defaultValue: "School",
    },

    country: {
      type: DataTypes.STRING(100),
      defaultValue: "India",
    },

    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "syllabuses",
    timestamps: true, // createdAt + updatedAt
  }
);
module.exports = Syllabus;
