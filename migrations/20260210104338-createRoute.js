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
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    /* =======================
       ROUTE_DRIVERS (JOIN TABLE)
    ======================= */
    await queryInterface.createTable('route_drivers', {
      route_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'route',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      driver_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'driver',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('route_drivers');
    await queryInterface.dropTable('route');

  }
};
