"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("student_achievement", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      achievement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "achievements",
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
      status: {
        type: Sequelize.ENUM(
          "1st prize",
          "2nd prize",
          "3rd prize",
          "participant",
          "other"
        ),
        allowNull: false,
      },
      proof_document: { type: Sequelize.STRING },
      remarks: { type: Sequelize.TEXT },
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
    await queryInterface.dropTable("student_achievement");
  },
};
