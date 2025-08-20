const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const NoticeClass = schoolSequelize.define(
  "NoticeClass",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    notice_id: { type: DataTypes.INTEGER, allowNull: false },
    class_id: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "notice_classes",
    timestamps: true,
  }
);

module.exports = NoticeClass;
