"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Chat = schoolSequelize.define(
  "Chat",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user1_id: { type: DataTypes.INTEGER, allowNull: false }, // First user
    user2_id: { type: DataTypes.INTEGER, allowNull: false }, // Second user
    last_message: { type: DataTypes.TEXT }, // Store last message
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "chats",
    timestamps: true,
  }
);

module.exports = Chat;
