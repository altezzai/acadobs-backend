"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const StudentRoutes = schoolSequelize.define(
  "StudentRoutes",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    route_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    isLock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    
  },
  {
    tableName: "route",
    timestamps: false,
  },
);

module.exports = StudentRoutes;
