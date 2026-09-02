"use strict";

const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../../config/connection");

const StopRoute = schoolSequelize.define(
  "StopRoute",
  {
    route_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    stop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "stop_routes",
    timestamps: false,
  },
);

module.exports = StopRoute;
