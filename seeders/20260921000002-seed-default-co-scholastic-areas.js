"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const defaultAreas = [
      // Common for All
      {
        id: 1,
        school_id: null,
        syllabus_id: 6,
        name: "Physical Education",
        class_group: "all",
        display_order: 1,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        school_id: null,
        syllabus_id: 6,
        name: "Attendance",
        class_group: "all",
        display_order: 2,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        school_id: null,
        syllabus_id: 6,
        name: "Arts",
        class_group: "1,2,3,4,5",
        display_order: 4,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        school_id: null,
        syllabus_id: 6,
        name: "Music",
        class_group: "1,2,3,4,5",
        display_order: 5,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      {
        id: 5,
        school_id: null,
        syllabus_id: 6,
        name: "Co-Curricular Activities",
        class_group: "6,7,8,9,10",
        display_order: 3,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        school_id: null,
        syllabus_id: 6,
        name: "Music/Arts/Robtics",
        class_group: "6,7,8,9",
        display_order: 4,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 7,
        school_id: null,
        syllabus_id: 6,
        name: "Music/Arts",
        class_group: "10",
        display_order: 4,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 8,
        school_id: null,
        syllabus_id: 6,
        name: "Colouring",
        class_group: "-1,-2",
        display_order: 3,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("co_scholastic_areas", defaultAreas, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("co_scholastic_areas", null, {});
  },
};
