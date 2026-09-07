"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../../config/connection");

const Stop = schoolSequelize.define(
  "Stop",
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
    stop_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      get() {
        const value = this.getDataValue("latitude");
        return value !== null ? parseFloat(value) : null;
      },
    },

    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      get() {
        const value = this.getDataValue("longitude");
        return value !== null ? parseFloat(value) : null;
      },
    },

    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    arrived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    arrived_time: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "stop",
    timestamps: false,
  },
);

// Associations
Stop.associate = (models) => {
  Stop.hasMany(models.Student, {
    foreignKey: "stop_id",
    as: "students",
  });
};

module.exports = Stop;
