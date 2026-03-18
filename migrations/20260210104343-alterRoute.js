'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /* =====================
    ADD pickId COLUMN
 ===================== */
    await queryInterface.addColumn('route', 'pickId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

  },

  async down(queryInterface, Sequelize) {
    /* =====================
       REMOVE pickId COLUMN
    ===================== */
    await queryInterface.removeColumn('route', 'pickId');
  }
};
