"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("homework_assignments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      homework_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "homeworks",
          key: "id",
        },
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "students",
          key: "id",
        },
      },
      remarks: Sequelize.STRING,
      points: { type: Sequelize.INTEGER, defaultValue: 0 },
      solved_file: Sequelize.STRING,
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
    await queryInterface.dropTable("homework_assignments");
  },
};
