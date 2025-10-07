"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("staff_permissions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      homeworks: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      attendance: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      timetable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      marks: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      achievements: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      parent_notes: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      student_leave_request: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      leave_request: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      chats: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      payments: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      reports: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      students: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("staff_permissions");
  },
};
