"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("timetable_substitutions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      timetable_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "timetables",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      sub_staff_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      subject_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "subjects",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true,
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

    await queryInterface.addConstraint("timetable_substitutions", {
      fields: ["timetable_id", "date"],
      type: "unique",
      name: "timetable_substitution_unique",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("timetable_substitutions");
  },
};
