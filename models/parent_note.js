"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const ParentNote = schoolSequelize.define(
  "ParentNote",
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
    note_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    note_content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    note_attachment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "parent_notes",
    timestamps: true,
  }
);

module.exports = ParentNote;
