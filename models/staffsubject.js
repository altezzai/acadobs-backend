const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const StaffSubject = schoolSequelize.define(
  "StaffSubject",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    school_id: { type: DataTypes.INTEGER, allowNull: false },
    staff_id: { type: DataTypes.INTEGER, allowNull: false },
    subject_id: { type: DataTypes.INTEGER, allowNull: false },
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
    tableName: "staff_subjects",
    timestamps: true,
  }
);
module.exports = StaffSubject;
