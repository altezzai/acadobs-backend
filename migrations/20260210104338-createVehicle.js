'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehicle', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      vehicle_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      photo: {
        type: Sequelize.STRING,
        allowNull: true,
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

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vehicle');

  }
};
