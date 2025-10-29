const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const StaffAttendance = schoolSequelize.define(
  "StaffAttendance",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Present", "Absent", "Half Day", "On Leave", "Late"),
      defaultValue: "Present",
    },
    check_in_time: DataTypes.DATE,
    check_out_time: DataTypes.DATE,
    total_hours: DataTypes.DECIMAL(5, 2),
    marked_by: DataTypes.INTEGER,
    marked_method: {
      type: DataTypes.ENUM("Manual", "Self", "Biometric"),
      defaultValue: "Manual",
    },
    remarks: DataTypes.TEXT,
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
    tableName: "staff_attendance",
    timestamps: true,
  }
);

module.exports = StaffAttendance;
