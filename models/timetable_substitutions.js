"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const TimetableSubstitution = schoolSequelize.define(
  "TimetableSubstitution",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    school_id: { type: DataTypes.INTEGER, allowNull: false },
    timetable_id: { type: DataTypes.INTEGER, allowNull: false },
    sub_staff_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    subject_id: { type: DataTypes.INTEGER, allowNull: true },
    reason: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "timetable_substitutions",
    timestamps: true,
  }
);
module.exports = TimetableSubstitution;
