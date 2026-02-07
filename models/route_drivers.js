"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const RouteDrivers = schoolSequelize.define(
    "RouteDrivers",
    {},
    {
        tableName: "route_drivers",
        timestamps: false,
    }
);

module.exports = RouteDrivers;
