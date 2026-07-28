"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("duties", "recorded_by", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("events", "recorded_by", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("notices", "recorded_by", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("stop", "recorded_by", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("payments", "updated_by", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
     await queryInterface.addColumn("staff_attendance", "marked_device_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("payments", "updated_by");
    await queryInterface.removeColumn("stop", "recorded_by");
    await queryInterface.removeColumn("notices", "recorded_by");
    await queryInterface.removeColumn("events", "recorded_by");
    await queryInterface.removeColumn("duties", "recorded_by");
    await queryInterface.removeColumn("staff_attendance", "marked_device_id");
  },
};