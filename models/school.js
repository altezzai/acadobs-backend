"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const Attendance = require("./attendance");

const School = schoolSequelize.define(
  "School",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.TEXT,
    logo: DataTypes.STRING,
    period_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
    },
    attendance_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
    },
    syllabus_type: {
      type: DataTypes.ENUM("CBSE", "ICSE", "Kerala State", "IB", "Other"),
      allowNull: true,
      defaultValue: "CBSE",
    },
    education_year_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pass_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 40.0,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "schools",
    timestamps: true,
  }
);

module.exports = School;
