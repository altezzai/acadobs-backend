"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("invoice_students", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      invoice_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "invoices", key: "id" },
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "students", key: "id" },
      },
      status: {
        type: Sequelize.ENUM("pending", "partially_paid", "paid", "overdue"),
        defaultValue: "pending",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
    //unique constraint on invoice_id and student_id
    await queryInterface.addConstraint("invoice_students", {
      fields: ["invoice_id", "student_id"],
      type: "unique",
      name: "unique_invoice_per_student",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("invoice_students");
  },
};
