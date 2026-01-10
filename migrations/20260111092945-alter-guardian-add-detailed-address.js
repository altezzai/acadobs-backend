"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn("guardians", "house_name", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("guardians", "street", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("guardians", "city", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("guardians", "landmark", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("guardians", "district", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("guardians", "state", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("guardians", "country", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("guardians", "post", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("guardians", "pincode", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("guardians", "house_name");
    await queryInterface.removeColumn("guardians", "street");
    await queryInterface.removeColumn("guardians", "city");
    await queryInterface.removeColumn("guardians", "landmark");
    await queryInterface.removeColumn("guardians", "district");
    await queryInterface.removeColumn("guardians", "state");
    await queryInterface.removeColumn("guardians", "country");
    await queryInterface.removeColumn("guardians", "post");
    await queryInterface.removeColumn("guardians", "pincode");
  },
};
