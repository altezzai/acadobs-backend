"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("internal_marks", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      subject_id: {
        type: Sequelize.INTEGER,
        allowNull: false, // Changed to false
      },
      internal_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      max_marks: {
        type: Sequelize.DECIMAL(5, 2),
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false, // Changed to false
      },
      recorded_by: {
        type: Sequelize.INTEGER,
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addConstraint("internal_marks", {
      fields: ["school_id", "class_id", "subject_id", "internal_name", "date"],
      type: "unique",
      name: "unique_internal_marks_combination",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("internal_marks");
  },
};
