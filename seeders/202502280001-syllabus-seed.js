"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const syllabuses = [
      // School / Board Syllabus
      { name: "Kerala State Syllabus", level: "School", country: "India" },
      { name: "SCERT Kerala", level: "School", country: "India" },
      { name: "Kerala State Board (KSSEB)", level: "School", country: "India" },
      {
        name: "Kerala Higher Secondary (DHSE)",
        level: "School",
        country: "India",
      },
      {
        name: "Kerala Vocational Higher Secondary (VHSE)",
        level: "School",
        country: "India",
      },
      { name: "CBSE", level: "School", country: "India" },
      { name: "ICSE", level: "School", country: "India" },
      { name: "ISC", level: "School", country: "India" },
      { name: "IGCSE", level: "School", country: "India" },
      {
        name: "Cambridge International (A-Levels)",
        level: "School",
        country: "UK",
      },
      { name: "Cambridge AS Level", level: "School", country: "UK" },
      { name: "Cambridge Lower Secondary", level: "School", country: "UK" },
      { name: "Cambridge Primary", level: "School", country: "UK" },
      { name: "IB PYP", level: "School", country: "International" }, // Primary Years
      { name: "IB MYP", level: "School", country: "International" }, // Middle Years
      { name: "IB DP", level: "School", country: "International" }, // Diploma Programme
      { name: "IB CP", level: "School", country: "International" }, // Career Programme
      { name: "NIOS", level: "School", country: "India" },
      { name: "Kendriya Vidyalaya (KVS)", level: "School", country: "India" },
      { name: "Jawahar Navodaya Vidyalaya", level: "School", country: "India" },
      { name: "Madarsa Board", level: "School", country: "India" },
      {
        name: "Special Education Curriculum (Kerala SCERT)",
        level: "School",
        country: "India",
      },
      {
        name: "KITE/IT@School Digital Curriculum",
        level: "School",
        country: "India",
      },

      // University
      { name: "Kannur University", level: "University", country: "India" },
      { name: "Calicut University", level: "University", country: "India" },
    ];

    // add timestamps
    const timestampedData = syllabuses.map((item) => ({
      ...item,
      description: null,
      trash: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return queryInterface.bulkInsert("syllabuses", timestampedData);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("syllabuses", null, {});
  },
};
