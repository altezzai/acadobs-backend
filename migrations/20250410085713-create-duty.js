"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("duties", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "schools", key: "id" },
      },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      deadline: { type: Sequelize.DATEONLY },
      file: { type: Sequelize.STRING },
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
    await queryInterface.addConstraint("duties", {
      fields: ["school_id", "title", "deadline"],
      type: "unique",
      name: "unique_duty_combination",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("duties");
  },
};
