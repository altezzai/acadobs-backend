"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("students", "second_language", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("students", "second_language");
  
  },
};
