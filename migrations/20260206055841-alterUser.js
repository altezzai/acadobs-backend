"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(
        "superadmin",
        "admin",
        "teacher",
        "staff",
        "guardian",
        "driver",
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(
        "superadmin",
        "admin",
        "teacher",
        "staff",
        "guardian",
      ),
      allowNull: false,
    });
  },
};
