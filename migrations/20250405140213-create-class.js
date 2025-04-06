"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("classes", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      division: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      classname: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "schools",
          key: "id", // Assuming 'id' is the primary key in the schools table
        },
        onDelete: "CASCADE",
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

    // Add composite unique constraint
    await queryInterface.addConstraint("classes", {
      fields: ["year", "division", "classname", "school_id"],
      type: "unique",
      name: "unique_class_combination",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("classes");
  },
};
