"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("notices", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "schools", key: "id" },
      },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      file: { type: Sequelize.STRING },
      type: {
        type: Sequelize.ENUM("all", "classes", "staffs"),
        allowNull: false,
      },
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
    await queryInterface.addIndex("notices", ["school_id"], {
      name: "notices_school_id_idx",
    });
    await queryInterface.addIndex("notices", ["title"], {
      name: "notices_title_idx",
    });
    await queryInterface.addIndex("notices", ["type"], {
      name: "notices_type_idx",
    });
    await queryInterface.addIndex("notices", ["date"], {
      name: "notices_date_idx",
    });
    await queryInterface.addIndex("notices", ["trash"], {
      name: "notices_trash_idx",
    });
  },
  down: async (queryInterface /*, Sequelize*/) => {
    await queryInterface.dropTable("notices");
  },
};
