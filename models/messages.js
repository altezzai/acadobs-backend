"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Message = schoolSequelize.define(
  "Message",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chat_id: { type: DataTypes.INTEGER, allowNull: false },
    sender_id: { type: DataTypes.INTEGER, allowNull: false },
    receiver_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    mediaUrl: { type: DataTypes.STRING, allowNull: true },
    replyToId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM("sent", "received", "read"),
      defaultValue: "sent",
    },
    type: {
      type: DataTypes.ENUM(
        "msg",
        "homeworks",
        "parent_notes",
        "internal_marks",
        "attendance",
        "achievements",
        "leave_requests",
        "payments",
        "events",
        "notices",
        "news"
      ),
      defaultValue: "msg",
    },
    type_id: { type: DataTypes.INTEGER, allowNull: true },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
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
    tableName: "messages",
    timestamps: true,
  }
);

module.exports = Message;
