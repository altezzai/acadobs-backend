"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../../config/connection");

const Driver = schoolSequelize.define(
  "Driver",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    school_id: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
 
  },
  {
    tableName: "driver",
    timestamps: false,
  }
);

module.exports = Driver;
