"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "schools", key: "id" },
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "students", key: "id" },
      },
      invoice_student_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "invoice_students", key: "id" },
      },
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
    await queryInterface.addConstraint("payments", {
      fields: [
        "invoice_student_id",
        "school_id",
        "student_id",
        "payment_type",
        "payment_date",
        "payment_status",
      ],
      type: "unique",
      name: "unique_payment_combination",
    });
    await queryInterface.addIndex("payments", ["school_id"], {
      name: "payments_school_id_idx",
    });
    await queryInterface.addIndex("payments", ["student_id"], {
      name: "payments_student_id_idx",
    });
    await queryInterface.addIndex("payments", ["payment_type"], {
      name: "payments_payment_type_idx",
    });
    await queryInterface.addIndex("payments", ["payment_status"], {
      name: "payments_payment_status_idx",
    });
    await queryInterface.addIndex("payments", ["payment_date"], {
      name: "payments_payment_date_idx",
    });
    await queryInterface.addIndex("payments", ["recorded_by"], {
      name: "payments_recorded_by_idx",
    });
    await queryInterface.addIndex("payments", ["trash"], {
      name: "payments_trash_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("payments");
    await queryInterface.removeIndex("payments", "payments_school_id_idx");
    await queryInterface.removeIndex("payments", "payments_student_id_idx");
    await queryInterface.removeIndex("payments", "payments_payment_type_idx");
    await queryInterface.removeIndex("payments", "payments_payment_status_idx");
    await queryInterface.removeIndex("payments", "payments_payment_date_idx");
    await queryInterface.removeIndex("payments", "payments_recorded_by_idx");
    await queryInterface.removeIndex("payments", "payments_trash_idx");
  },
};
