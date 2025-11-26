const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const AccountDelete = schoolSequelize.define(
  "AccountDelete",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "rejected"),
      defaultValue: "pending",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "account_deletes",
    timestamps: true,
  }
);
module.exports = AccountDelete;
