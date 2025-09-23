"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      school_id: { type: Sequelize.INTEGER, allowNull: false },
      student_id: { type: Sequelize.INTEGER, allowNull: true },
      invoice_student_id: { type: Sequelize.INTEGER, allowNull: true },
      payment_type: {
        type: Sequelize.ENUM(
          "tuition",
          "admission",
          "exam",
          "transport",
          "hostel",
          "lab",
          "library",
          "activity",
          "fine",
          "donation",
          "event",
          "excursion",
          "other"
        ),
        allowNull: true,
      },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      payment_date: { type: Sequelize.DATEONLY, allowNull: false },
      payment_status: {
        type: Sequelize.ENUM("pending", "completed", "failed", "refunded"),
        defaultValue: "pending",
      },
      transaction_id: { type: Sequelize.STRING, unique: true },
      payment_method: {
        type: Sequelize.ENUM(
          "cash",
          "bank_transfer",
          "upi",
          "credit_card",
          "debit_card",
          "wallet"
        ),
        allowNull: false,
      },
      remarks: { type: Sequelize.TEXT },
      recorded_by: { type: Sequelize.INTEGER, allowNull: true },
      trash: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    // await queryInterface.addConstraint("Payments", {
    //   fields: [
    //     "school_id",
    //     "student_id",
    //     "payment_type",
    //     "payment_date",
    //     "payment_status",
    //   ],
    //   type: "unique",
    //   name: "unique_payment_combination",
    // });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("payments");
  },
};
