'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_stop_log', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      route_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'route',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      stop_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'stop',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'driver',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      arrived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      arrived_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },

    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('route_stop_log');
  }
};
