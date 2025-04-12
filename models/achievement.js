"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const Achievement = schoolSequelize.define(
  "Achievement",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    school_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.ENUM("academic", "sports", "arts", "other") },
    level: {
      type: DataTypes.ENUM(
        "class",
        "school",
        "district",
        "state",
        "national",
        "international"
      ),
    },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    awarding_body: { type: DataTypes.STRING },
    recorded_by: { type: DataTypes.INTEGER, allowNull: false },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    timestamps: true,
    tableName: "achievements",
  }
);

module.exports = Achievement;
