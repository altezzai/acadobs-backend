"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("achievements", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
      },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      category: { type: Sequelize.ENUM("academic", "sports", "arts", "other") },
      level: {
        type: Sequelize.ENUM(
          "class",
          "school",
          "district",
          "state",
          "national",
          "international"
        ),
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      awarding_body: { type: Sequelize.STRING },
      recorded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
      },
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
    await queryInterface.addConstraint("achievements", {
      fields: ["school_id", "title", "recorded_by", "date"],
      type: "unique",
      name: "unique_achievement_combination",
    });
    await queryInterface.addIndex("achievements", ["school_id"], {
      name: "achievements_school_id_idx",
    });
    await queryInterface.addIndex("achievements", ["title"], {
      name: "achievements_title_idx",
    });
    await queryInterface.addIndex("achievements", ["category"], {
      name: "achievements_category_idx",
    });
    await queryInterface.addIndex("achievements", ["level"], {
      name: "achievements_level_idx",
    });
    await queryInterface.addIndex("achievements", ["date"], {
      name: "achievements_date_idx",
    });
    await queryInterface.addIndex("achievements", ["trash"], {
      name: "achievements_trash_idx",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("achievements");
    await queryInterface.removeIndex(
      "achievements",
      "achievements_school_id_idx"
    );
    await queryInterface.removeIndex("achievements", "achievements_title_idx");
    await queryInterface.removeIndex(
      "achievements",
      "achievements_category_idx"
    );
    await queryInterface.removeIndex("achievements", "achievements_level_idx");
    await queryInterface.removeIndex("achievements", "achievements_date_idx");
    await queryInterface.removeIndex("achievements", "achievements_trash_idx");
  },
};
