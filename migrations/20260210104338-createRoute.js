'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      route_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'vehicle',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'driver',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isLock: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      trash: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('route');

  }
};
