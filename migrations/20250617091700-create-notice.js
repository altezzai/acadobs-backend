"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("notices", {
      notice_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      school_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      file: { type: Sequelize.STRING },
      type: { type: Sequelize.ENUM("all", "classes"), allowNull: false },
      date: { type: Sequelize.DATEONLY, defaultValue: Sequelize.NOW },
      trash: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
    await queryInterface.addConstraint("notices", {
      fields: ["school_id", "title", "type", "date"],
      type: "unique",
      name: "unique_notice_combination",
    });
  },
  down: async (queryInterface /*, Sequelize*/) => {
    await queryInterface.dropTable("notices");
  },
};
