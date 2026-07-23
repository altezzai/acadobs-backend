'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('exams', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      exam_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      publish: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      education_year: {
        type: Sequelize.STRING,
        allowNull: false,
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
    })

  },

  async down(queryInterface) {
    await queryInterface.dropTable('exams');
  }
};
