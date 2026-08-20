'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = [
      'vehicle',
      'route',
      'route_drivers',
      'route_stop_log',
    ];

    const [results] = await queryInterface.sequelize.query(`
      SELECT
        TABLE_NAME,
        CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        TABLE_SCHEMA = DATABASE()
        AND COLUMN_NAME = 'driver_id'
        AND REFERENCED_TABLE_NAME = 'driver'
        AND REFERENCED_COLUMN_NAME = 'id'
        AND TABLE_NAME IN (
          'vehicle',
          'route',
          'route_drivers',
          'route_stop_log'
        );
    `);

    for (const constraint of results) {
      await queryInterface.removeConstraint(
        constraint.TABLE_NAME,
        constraint.CONSTRAINT_NAME
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Intentionally empty.
    //
    // This migration removes the old driver -> driver_id
    // foreign-key references.
    //
    // The newer users.id references should remain untouched.
  },
};