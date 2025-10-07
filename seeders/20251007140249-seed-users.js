"use strict";
const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword1 = await bcrypt.hash("SuperAdmin@123", 10);
    const hashedPassword2 = await bcrypt.hash("SchoolAdmin@123", 10);

    await queryInterface.bulkInsert("users", [
      {
        name: "System Superadmin",
        email: "superadmin@altezzai.com",
        phone: "9999999999",
        password: hashedPassword1,
        dp: null,
        school_id: 0, // superadmin not tied to a specific school
        role: "superadmin",
        status: "active",
        verified: true,
        trash: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Altezzai School Admin",
        email: "schooladmin@altezzai.com",
        phone: "8888888888",
        password: hashedPassword2,
        dp: null,
        school_id: 1, // link to school ID 1
        role: "admin",
        status: "active",
        verified: true,
        trash: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
