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
      start_date: { type: Sequelize.DATEONLY },
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
    await queryInterface.addIndex("duties", ["school_id"], {
      name: "duties_school_id_idx",
    });
    await queryInterface.addIndex("duties", ["title"], {
      name: "duties_title_idx",
    });
    await queryInterface.addIndex("duties", ["deadline"], {
      name: "duties_deadline_idx",
    });
    await queryInterface.addIndex("duties", ["trash"], {
      name: "duties_trash_idx",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("duties");
  },
};
