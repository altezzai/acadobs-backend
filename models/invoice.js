const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const Invoice = schoolSequelize.define(
  "Invoice",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    school_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    due_date: { type: DataTypes.DATEONLY },
    category: {
      type: DataTypes.ENUM(
        "tuition",
        "admission",
        "exam",
        "transport",
        "hostel",
        "lab",
        "library",
        "activity",
        "fine",
        "event",
        "excursion",
        "other"
      ),
      allowNull: false,
    },
    recorded_by: { type: DataTypes.INTEGER },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "invoices", timestamps: true }
);

module.exports = Invoice;
