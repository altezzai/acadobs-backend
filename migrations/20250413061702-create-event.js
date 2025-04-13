"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("events", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      school_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      venue: { type: Sequelize.STRING },
      url: { type: Sequelize.STRING },
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
  },
  async down(queryInterface) {
    await queryInterface.dropTable("events");
  },
};
