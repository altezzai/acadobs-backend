"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("news", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools", // Assuming you have a 'schools' table
          key: "id",
        },
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users", // Assuming you have a 'users' table
          key: "id",
        },
      },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
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
    await queryInterface.addConstraint("news", {
      fields: ["school_id", "title", "user_id"],
      type: "unique",
      name: "unique_news_combination",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("news");
  },
};
