"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the old unique constraint (school_id, class_id, day_of_week, period_number)
    await queryInterface.removeConstraint(
      "timetables",
      "unique_class_day_period_per_school"
    );

    // Add updated unique constraint including staff_id
    await queryInterface.addConstraint("timetables", {
      fields: [
        "school_id",
        "class_id",
        "day_of_week",
        "period_number",
        "staff_id",
      ],
      type: "unique",
      name: "unique_class_day_period_staff_per_school",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove updated unique constraint
    await queryInterface.removeConstraint(
      "timetables",
      "unique_class_day_period_staff_per_school"
    );

    // Revert back to original unique constraint without staff_id
    await queryInterface.addConstraint("timetables", {
      fields: ["school_id", "class_id", "day_of_week", "period_number"],
      type: "unique",
      name: "unique_class_day_period_per_school",
    });
  },
};
