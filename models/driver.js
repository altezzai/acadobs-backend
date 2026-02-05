"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Driver = schoolSequelize.define(
  "Driver",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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

    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "driver",
    timestamps: false,
  },
  {
    tableName: "role",
    type: DataTypes.ENUM(
      "superadmin",
      "admin",
      "teacher",
      "staff",
      "guardian",
      "driver",
    ),
    timestamps: false,
  },
);

// // Associations
Driver.associate = (models) => {
  // Driver → User
  Driver.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });

  // Driver → Vehicles (One-to-Many)
  Driver.hasMany(models.Vehicle, {
    foreignKey: "driver_id",
    as: "vehicles",
  });

  // Driver ↔ Route (Many-to-Many)
  Driver.belongsToMany(models.Route, {
    through: "route_drivers",
    foreignKey: "driver_id",
    otherKey: "route_id",
    as: "routes",
  });
};
module.exports = Driver;
