'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /* =====================
         CHANGE COLUMN (nullable)
      ===================== */
    await queryInterface.changeColumn('stop', 'priority', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    /* =====================
       ADD UNIQUE INDEX
    ===================== */
    await queryInterface.addIndex('stop', ['priority'], {
      name: 'IDX_STOP_PRIORITY_UNIQUE',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    /* =====================
          REMOVE INDEX
       ===================== */
    await queryInterface.removeIndex('stop', 'IDX_STOP_PRIORITY_UNIQUE');

    /* =====================
       REVERT COLUMN (not nullable)
    ===================== */
    await queryInterface.changeColumn('stop', 'priority', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  }
};
