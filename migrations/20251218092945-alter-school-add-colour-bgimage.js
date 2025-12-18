"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("schools", "primary_colour", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("schools", "secondary_colour", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("schools", "bg_image", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("schools", "primary_colour");
    await queryInterface.removeColumn("schools", "secondary_colour");
    await queryInterface.removeColumn("schools", "bg_image");
  },
};
