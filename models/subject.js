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
    subject_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class_range: {
      type: DataTypes.ENUM("1-4", "5-7", "8-10", "11-12", "other"),
      allowNull: false,
    },
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
