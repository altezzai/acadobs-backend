"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const RouteStopLog = schoolSequelize.define(
    "RouteStopLog",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        route_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        stop_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        driver_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        arrived: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        arrived_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "route_stop_log",
        timestamps: false,
    },
);
module.exports = RouteStopLog;
