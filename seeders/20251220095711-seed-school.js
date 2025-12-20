"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "schools",
      [
        {
          name: "Altezzai School Admin",
          email: "schooladmin@altezzai.com",
          phone: "8888888888",
          address: "kannur , kerala",
          logo: "",
          period_count: 7,
          attendance_count: 2,
          syllabus_id: 1,
          education_year_start: "2025-04-01",
          location: "India/Kolkata",
          pass_percent: 40.0,
          primary_colour: "#2a92d3ff",
          secondary_colour: "#0d3387ff",
          bg_image: "",
          status: "active",
          trash: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("schools", null, {});
  },
};
