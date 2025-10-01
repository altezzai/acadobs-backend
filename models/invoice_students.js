const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const InvoiceStudent = schoolSequelize.define(
  "InvoiceStudent",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoice_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "partially_paid", "paid", "overdue"),
      defaultValue: "pending",
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "invoice_students",
    timestamps: true,
  }
);

module.exports = InvoiceStudent;
