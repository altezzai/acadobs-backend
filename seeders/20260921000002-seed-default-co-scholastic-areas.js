"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const defaultAreas = [
      // KG
      {
        id: 1,
        school_id: null,
        syllabus_id: null,
        name: "Physical Education",
        class_group: "KG",
        display_order: 1,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        school_id: null,
        syllabus_id: null,
        name: "Arts",
        class_group: "KG",
        display_order: 2,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        school_id: null,
        syllabus_id: null,
        name: "Music",
        class_group: "KG",
        display_order: 3,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // 1-5
      {
        id: 4,
        school_id: null,
        syllabus_id: null,
        name: "Physical Education",
        class_group: "1-5",
        display_order: 1,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        school_id: null,
        syllabus_id: null,
        name: "Arts",
        class_group: "1-5",
        display_order: 2,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        school_id: null,
        syllabus_id: null,
        name: "Music",
        class_group: "1-5",
        display_order: 3,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // 6-8
      {
        id: 7,
        school_id: null,
        syllabus_id: null,
        name: "Physical Education",
        class_group: "6-8",
        display_order: 1,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 8,
        school_id: null,
        syllabus_id: null,
        name: "Co-Curricular Activities",
        class_group: "6-8",
        display_order: 2,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 9,
        school_id: null,
        syllabus_id: null,
        name: "Music",
        class_group: "6-8",
        display_order: 3,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // 9-10
      {
        id: 10,
        school_id: null,
        syllabus_id: null,
        name: "Physical Education",
        class_group: "9-10",
        display_order: 1,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 11,
        school_id: null,
        syllabus_id: null,
        name: "Co-Curricular Activities",
        class_group: "9-10",
        display_order: 2,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 12,
        school_id: null,
        syllabus_id: null,
        name: "Arts",
        class_group: "9-10",
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
