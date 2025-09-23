"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("invoices", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      school_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      due_date: { type: Sequelize.DATEONLY },
      category: {
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
          "event",
          "excursion",
          "other"
        ),
        allowNull: false,
      },
      recorded_by: { type: Sequelize.INTEGER },
      trash: { type: Sequelize.BOOLEAN, defaultValue: false },
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
    //unique constraint on title and school_id
    await queryInterface.addConstraint("invoices", {
      fields: ["title", "school_id", "category", "due_date"],
      type: "unique",
      name: "unique_invoice_title_per_school",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("invoices");
  },
};
