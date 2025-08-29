"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("news_images", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      news_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "news", // Assuming you have a 'news' table
          key: "id",
        },
      },
      image_url: { type: Sequelize.STRING, allowNull: false },
      caption: { type: Sequelize.STRING },
      trash: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("news_images");
  },
};
