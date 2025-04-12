"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const StudentAchievement = schoolSequelize.define(
  "StudentAchievement",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    achievement_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "1st prize",
        "2nd prize",
        "3rd prize",
        "participant",
        "other"
      ),
      allowNull: false,
    },
    proof_document: { type: DataTypes.STRING },
    remarks: { type: DataTypes.TEXT },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    timestamps: true,
    tableName: "student_achievement",
  }
);

module.exports = StudentAchievement;
