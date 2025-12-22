"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("notice_classes", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      notice_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "notices",
          key: "id",
        },
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "classes",
          key: "id",
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
  down: async (queryInterface /*, Sequelize*/) => {
    await queryInterface.dropTable("notice_classes");
  },
};
