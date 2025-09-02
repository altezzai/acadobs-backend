const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Staff = schoolSequelize.define(
  "Staff",
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("teacher", "staff"),
      allowNull: false,
    },
    qualification: DataTypes.STRING,
    address: DataTypes.TEXT,
    class_id: DataTypes.INTEGER,
    trash: {
      type: DataTypes.BOOLEAN,
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
    tableName: "staffs",
    timestamps: true,
  }
);

module.exports = Staff;
