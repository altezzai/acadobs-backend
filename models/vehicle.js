"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Vehicle = schoolSequelize.define(
  "Vehicle",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    model: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    vehicle_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "vehicle",
    timestamps: false,
  },
);
module.exports = Vehicle;
