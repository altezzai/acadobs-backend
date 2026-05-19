"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("student_transfers", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "students", key: "id" },
        onDelete: "CASCADE",
      },
      from_school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "schools", key: "id" },
      },
      to_school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "schools", key: "id" },
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      requested_by_role: {
        type: Sequelize.ENUM("guardian", "admin"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "accepted", "rejected"),
        defaultValue: "pending",
      },
      reason: { type: Sequelize.TEXT, allowNull: true },
      admin_remarks: { type: Sequelize.TEXT, allowNull: true },
      reviewed_by: {
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
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    await queryInterface.addIndex("student_transfers", ["student_id"], {
      name: "student_transfers_student_id_idx",
    });
    await queryInterface.addIndex("student_transfers", ["from_school_id"], {
      name: "student_transfers_from_school_id_idx",
    });
    await queryInterface.addIndex("student_transfers", ["to_school_id"], {
      name: "student_transfers_to_school_id_idx",
    });
    await queryInterface.addIndex("student_transfers", ["status"], {
      name: "student_transfers_status_idx",
    });
    await queryInterface.addIndex("student_transfers", ["trash"], {
      name: "student_transfers_trash_idx",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("student_transfers");
  },
};
