'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /* =====================
           ADD stop_id COLUMN
        ===================== */
    await queryInterface.addColumn('students', 'stop_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    /* =====================
       ADD route_id COLUMN
    ===================== */
    await queryInterface.addColumn('students', 'route_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    /* =====================
       ADD FOREIGN KEYS
    ===================== */
    await queryInterface.addConstraint('students', {
      fields: ['stop_id'],
      type: 'foreign key',
      name: 'fk_students_stop_id',
      references: {
        table: 'stop',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('students', {
      fields: ['route_id'],
      type: 'foreign key',
      name: 'fk_students_route_id',
      references: {
        table: 'route',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    /* =====================
          REMOVE FOREIGN KEYS
       ===================== */
    await queryInterface.removeConstraint('students', 'fk_students_stop_id');
    await queryInterface.removeConstraint('students', 'fk_students_route_id');

    /* =====================
       REMOVE COLUMNS
    ===================== */
    await queryInterface.removeColumn('students', 'stop_id');
    await queryInterface.removeColumn('students', 'route_id');
  }
};
