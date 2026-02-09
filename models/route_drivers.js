"use strict";

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
