"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("duty_assignments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      staff_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      duty_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "duties",
          key: "id",
        },
      },
      status: {
        type: Sequelize.ENUM("pending", "in_progress", "completed"),
        defaultValue: "pending",
      },
      remarks: { type: Sequelize.TEXT },
      solved_file: { type: Sequelize.STRING },
      trash: { type: Sequelize.BOOLEAN, defaultValue: false },
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
  down: async (queryInterface) => {
    await queryInterface.dropTable("duty_assignments");
  },
};
