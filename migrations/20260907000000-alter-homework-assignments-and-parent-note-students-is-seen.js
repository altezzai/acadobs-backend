"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add is_seen to homework_assignments
    await queryInterface.addColumn("homework_assignments", "is_seen", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    // 2. Modify parent_note_students: remove status, add is_seen
    try {
      await queryInterface.removeIndex(
        "parent_note_students",
        "parent_note_students_status_idx"
      );
    } catch (e) {
      // Index might not exist in some environments
    }
    await queryInterface.removeColumn("parent_note_students", "status");
    await queryInterface.addColumn("parent_note_students", "is_seen", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addIndex("parent_note_students", ["is_seen"], {
      name: "parent_note_students_is_seen_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Revert parent_note_students
    try {
      await queryInterface.removeIndex(
        "parent_note_students",
        "parent_note_students_is_seen_idx"
      );
    } catch (e) {
      // Index might not exist
    }
    await queryInterface.removeColumn("parent_note_students", "is_seen");
    await queryInterface.addColumn("parent_note_students", "status", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addIndex("parent_note_students", ["status"], {
      name: "parent_note_students_status_idx",
    });

    // 2. Revert homework_assignments
    await queryInterface.removeColumn("homework_assignments", "is_seen");
  },
};
