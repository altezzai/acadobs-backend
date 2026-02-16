"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Stop = schoolSequelize.define(
  "Stop",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    route_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    stop_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    priority: {
      type: DataTypes.INTEGER,
      unique: true,
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
    }
  },
  {
    tableName: "stop",
    timestamps: false,
  },
);

//Associations
Stop.associate = (models) => {
  Stop.belongsTo(models.Route, {
    foreignKey: "route_id",
    as: "route",
    onDelete: "CASCADE",
  });

  Stop.hasMany(models.Student, {
    foreignKey: "stop_id",
    as: "students",
  });
};

module.exports = Stop;
