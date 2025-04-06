"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("subjects", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      subject_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      class_range: {
        type: Sequelize.ENUM("1-4", "5-7", "8-10", "11-12", "other"),
        allowNull: false,
      },
      school_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "schools",
          key: "id",
        },
        onDelete: "CASCADE",
        allowNull: true,
      },
      trash: {
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

    // Add unique constraint
    await queryInterface.addConstraint("subjects", {
      fields: ["subject_name", "class_range", "school_id"],
      type: "unique",
      name: "unique_subject_per_range_and_school",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("subjects");
  },
};
