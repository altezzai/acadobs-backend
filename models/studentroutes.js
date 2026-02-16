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
      type: DataTypes.ENUM("PICKUP", "DROP"),
      allowNull: true,
    },

    isLock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    activated_by_driver_id: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
    activated_at: {
      type: DataTypes.DATE,
      defaultValue: null,
    },


  },
  {
    tableName: "route",
    timestamps: false,
  },
);

module.exports = StudentRoutes;
