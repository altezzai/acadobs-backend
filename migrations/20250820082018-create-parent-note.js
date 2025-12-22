"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("parent_notes", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
      },
      note_title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      note_content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      note_attachment: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      recorded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      trash: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
    await queryInterface.addConstraint("parent_notes", {
      fields: ["school_id", "note_title", "note_content", "recorded_by"],
      type: "unique",
      name: "unique_parent_note_combination",
    });
    await queryInterface.addIndex("parent_notes", ["school_id"], {
      name: "parent_notes_school_id_idx",
    });
    await queryInterface.addIndex("parent_notes", ["note_title"], {
      name: "parent_notes_note_title_idx",
    });
    await queryInterface.addIndex("parent_notes", ["recorded_by"], {
      name: "parent_notes_recorded_by_idx",
    });
    await queryInterface.addIndex("parent_notes", ["trash"], {
      name: "parent_notes_trash_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("parent_notes");
    await queryInterface.removeIndex(
      "parent_notes",
      "parent_notes_school_id_idx"
    );
    await queryInterface.removeIndex(
      "parent_notes",
      "parent_notes_note_title_idx"
    );
    await queryInterface.removeIndex(
      "parent_notes",
      "parent_notes_recorded_by_idx"
    );
    await queryInterface.removeIndex("parent_notes", "parent_notes_trash_idx");
  },
};
