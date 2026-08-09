"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("parent_note_students", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      parentnote_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "parent_notes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "students",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addIndex("parent_note_students", ["parentnote_id"], {
      name: "parent_note_students_parentnote_id_idx",
    });
    await queryInterface.addIndex("parent_note_students", ["student_id"], {
      name: "parent_note_students_student_id_idx",
    });
    await queryInterface.addIndex("parent_note_students", ["status"], {
      name: "parent_note_students_status_idx",
    });
    await queryInterface.addConstraint("parent_note_students", {
      fields: ["parentnote_id", "student_id"],
      type: "unique",
      name: "unique_parent_note_student",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("parent_note_students");
  },
};
