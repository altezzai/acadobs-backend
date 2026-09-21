"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../../config/connection");

const CoScholasticArea = schoolSequelize.define(
  "CoScholasticArea",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    syllabus_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    class_group: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: "co_scholastic_areas",
    timestamps: true,
  }
);

module.exports = CoScholasticArea;
