'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('vehicle', 'driver_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    });

    await queryInterface.changeColumn('route', 'driver_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('vehicle', 'driver_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'driver',
        key: 'id',
      },
      onDelete: 'CASCADE',
    });

    await queryInterface.changeColumn('route', 'driver_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'driver',
        key: 'id',
      },
      onDelete: 'CASCADE',
    });
  },
};
