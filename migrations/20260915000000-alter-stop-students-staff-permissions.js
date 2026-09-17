"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add charge column to stop table
    await queryInterface.addColumn("stop", "charge", {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: true,
    });

    await queryInterface.removeColumn("students", "student_status");

    await queryInterface.addColumn("students", "one_way", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn("students", "drop_route_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "route",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("staff_permissions", "payment_managment", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert staff_permissions changes
    await queryInterface.removeColumn("staff_permissions", "payment_managment");
    // Revert students changes
    await queryInterface.removeColumn("students", "drop_route_id");
    await queryInterface.removeColumn("students", "one_way");
    await queryInterface.addColumn("students", "student_status", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });

    // Revert stop changes
    await queryInterface.removeColumn("stop", "charge");
  },
};
