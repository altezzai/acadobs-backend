"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("schools", "staff_check_in_time", {
      type: Sequelize.TIME,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("schools", "teacher_check_in_time", {
      type: Sequelize.TIME,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("schools", "staff_check_in_time");
    await queryInterface.removeColumn("schools", "teacher_check_in_time");
  },
};
