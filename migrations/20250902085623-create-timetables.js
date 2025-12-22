"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("timetables", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "classes",
          key: "id",
        },
      },
      day_of_week: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      period_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      staff_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      subject_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "subjects",
          key: "id",
        },
      },

      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Unique constraint for school, class, day, period
    await queryInterface.addConstraint("timetables", {
      fields: ["school_id", "class_id", "day_of_week", "period_number"],
      type: "unique",
      name: "unique_class_day_period_per_school",
    });
    await queryInterface.addIndex("timetables", ["school_id"], {
      name: "timetables_school_id_idx",
    });
    await queryInterface.addIndex("timetables", ["class_id"], {
      name: "timetables_class_id_idx",
    });
    await queryInterface.addIndex("timetables", ["staff_id"], {
      name: "timetables_staff_id_idx",
    });
    await queryInterface.addIndex("timetables", ["subject_id"], {
      name: "timetables_subject_id_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("timetables");
  },
};
