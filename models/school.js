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

module.exports = School;
