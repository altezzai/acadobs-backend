"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("leave_requests", "leave_type", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "other",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("leave_requests", "leave_type", {
      type: Sequelize.ENUM(
        "sick",
        "casual",
        "emergency",
        "vacation",
        "onduty",
        "other"
      ),
      allowNull: true,
      defaultValue: "other",
    });
  },
};