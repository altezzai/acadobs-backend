"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const User = require("./user");

const Student = schoolSequelize.define(
  "Student",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    school_id: { type: DataTypes.INTEGER, allowNull: false },
    guardian_id: { type: DataTypes.INTEGER, allowNull: false },
    reg_no: { type: DataTypes.STRING, unique: true },
    roll_number: { type: DataTypes.INTEGER, allowNull: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    date_of_birth: { type: DataTypes.DATE },
    gender: { type: DataTypes.ENUM("male", "female", "other") },
    class_id: { type: DataTypes.INTEGER },
    admission_date: { type: DataTypes.DATE },
    address: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    image: { type: DataTypes.STRING },
    alumni: { type: DataTypes.BOOLEAN, defaultValue: false },
    second_language: { type: DataTypes.STRING },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "students",
    timestamps: true,
  }
);
Student.belongsTo(User, { foreignKey: "guardian_id" });

module.exports = Student;
