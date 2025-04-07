"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

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

School.associate = function (models) {
  School.hasMany(models.Class, { foreignKey: "school_id" });
  School.hasMany(models.Subject, { foreignKey: "school_id" });
  School.hasMany(models.Guardian, { foreignKey: "school_id" });
  School.hasMany(models.Student, { foreignKey: "school_id" });
  School.hasMany(models.Staff, { foreignKey: "school_id" });
  School.hasMany(models.InternalExam, { foreignKey: "school_id" });
  School.hasMany(models.Exam, { foreignKey: "school_id" });
};

module.exports = School;
