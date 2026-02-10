'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.changeColumn('stop', 'priority', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addConstraint('stop', {
      fields: ['priority'],
      type: 'unique',
      name: 'unique_stop_priority',
    });
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeConstraint('stop', 'unique_stop_priority');

    await queryInterface.changeColumn('stop', 'priority', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
};
