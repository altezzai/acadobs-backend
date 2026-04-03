"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Session = schoolSequelize.define(
  "Session",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    refresh_token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    device_info: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
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
    tableName: "sessions",
    timestamps: true,
  }
);

module.exports = Session;
