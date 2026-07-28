"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("staff_permissions", "alumni", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "events", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "news", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "notice", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "exam", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "transportation", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "teachers", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "teachers_leaveReuest", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "teachers_duties", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,    
    });
    await queryInterface.addColumn("staff_permissions", "teachers_attendance", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "staffs", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "staffs_leaveReuest", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "staffs_duties", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "staffs_attendance", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("staff_permissions", "aiAnalytics", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("staff_permissions", "aiAnalytics");
    await queryInterface.removeColumn("staff_permissions", "staffs");
    await queryInterface.removeColumn("staff_permissions", "teachers");
    await queryInterface.removeColumn("staff_permissions", "transportation");
    await queryInterface.removeColumn("staff_permissions", "exam");
    await queryInterface.removeColumn("staff_permissions", "notice");
    await queryInterface.removeColumn("staff_permissions", "news");
    await queryInterface.removeColumn("staff_permissions", "events");
    await queryInterface.removeColumn("staff_permissions", "alumni");
    await queryInterface.removeColumn("staff_permissions", "teachers_leaveReuest");
    await queryInterface.removeColumn("staff_permissions", "teachers_duties");
    await queryInterface.removeColumn("staff_permissions", "teachers_attendance");
    await queryInterface.removeColumn("staff_permissions", "staffs_leaveReuest");
    await queryInterface.removeColumn("staff_permissions", "staffs_duties");
    await queryInterface.removeColumn("staff_permissions", "staffs_attendance");
  },
};