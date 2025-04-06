"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("students", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      guardian_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      class_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "classes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      reg_no: { type: Sequelize.STRING, unique: true },
      full_name: { type: Sequelize.STRING, allowNull: false },
      date_of_birth: { type: Sequelize.DATE },
      gender: { type: Sequelize.ENUM("male", "female", "other") },
      admission_date: { type: Sequelize.DATE },
      status: {
        type: Sequelize.ENUM("active", "inactive"),
        defaultValue: "active",
      },
      image: { type: Sequelize.STRING },
      alumni: { type: Sequelize.BOOLEAN, defaultValue: false },
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("students");
  },
};
