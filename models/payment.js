"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const Payment = schoolSequelize.define(
  "Payment",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    school_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: true },
    payment_type: {
      type: DataTypes.ENUM(
        "tuition",
        "exam_fee",
        "hostel_fee",
        "transport_fee",
        "library_fee",
        "donation",
        "other"
      ),
      allowNull: false,
    },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    payment_date: { type: DataTypes.DATEONLY, allowNull: false },
    payment_status: {
      type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
      defaultValue: "pending",
    },
    transaction_id: { type: DataTypes.STRING, unique: true },
    payment_method: {
      type: DataTypes.ENUM(
        "cash",
        "bank_transfer",
        "upi",
        "credit_card",
        "debit_card",
        "wallet"
      ),
      allowNull: false,
    },
    recorded_by: { type: DataTypes.INTEGER, allowNull: true },
    remarks: { type: DataTypes.TEXT },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "payments",
    timestamps: true,
  }
);

module.exports = Payment;
