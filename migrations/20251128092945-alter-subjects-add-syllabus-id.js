"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Remove old ENUM column
    await queryInterface.removeColumn("subjects", "syllabus_type");

    // 2. Add new syllabus_id column
    await queryInterface.addColumn("subjects", "syllabus_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "syllabuses",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("subjects", "syllabus_id");
    await queryInterface.addColumn("subjects", "syllabus_type", {
      type: Sequelize.ENUM("CBSE", "ICSE", "Kerala State", "IB", "Other"),
      allowNull: true,
      defaultValue: "CBSE",
    });
  },
};
