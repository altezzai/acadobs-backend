'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /* =====================
           REMOVE OLD UNIQUE INDEX (if exists)
        ===================== */
    try {
      await queryInterface.removeIndex('stop', 'IDX_STOP_PRIORITY_UNIQUE');
    } catch (error) {
      // ignore if index doesn't exist
    }

    /* =====================
       ADD COMPOSITE UNIQUE INDEX
    ===================== */
    await queryInterface.addIndex('stop', ['route_id', 'priority'], {
      name: 'IDX_ROUTE_PRIORITY_UNIQUE',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    /* =====================
    REMOVE COMPOSITE INDEX
 ===================== */
    await queryInterface.removeIndex('stop', 'IDX_ROUTE_PRIORITY_UNIQUE');

  }
};
