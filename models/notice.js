const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const Notice = schoolSequelize.define(
  "Notice",
  {
    notice_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    school_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    file: { type: DataTypes.STRING },
    type: { type: DataTypes.ENUM("all", "classes"), allowNull: false },
    date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "notices",
    timestamps: false,
  }
);

module.exports = Notice;
