"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../../config/connection");

const StudentsStopStatus = schoolSequelize.define(
  "StudentsStopStatus",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    livelocation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "picked",
        "not_picked",
        "dropped",
        "not_dropped"
      ),
      allowNull: false,
    },
  },
  {
    tableName: "students_stop_status",
    timestamps: true,
  }
);

module.exports = StudentsStopStatus;