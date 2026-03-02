"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const StudentRouteAssignment = schoolSequelize.define(
    "StudentRouteAssignment",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        route_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        trash: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: true,
        },
    },
    {
        tableName: "student_route_assignments",
        timestamps: false,
    }
);

module.exports = StudentRouteAssignment;
