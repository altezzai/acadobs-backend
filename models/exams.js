"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Exams = schoolSequelize.define(
    "exams",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        school_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        exam_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        publish: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        education_year: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        trash: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
        tableName: "exams",
        timestamps: true,
    }
);
module.exports = Exams;