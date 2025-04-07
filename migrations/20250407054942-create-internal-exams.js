"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("internal_exams", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      subject_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      internal_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      max_marks: {
        type: Sequelize.DECIMAL(5, 2),
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("internal_exams");
  },
};
