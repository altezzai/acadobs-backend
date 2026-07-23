'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.removeColumn("internal_marks", "term");

    await queryInterface.addColumn("internal_marks", "exam_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "exams",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("internal_marks", "exam_id");

    await queryInterface.addColumn("internal_marks", "term", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }

}

