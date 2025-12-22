"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("attendance", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
      },
      teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
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
      subject_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "subjects",
          key: "id",
        },
      },
      period: { type: Sequelize.INTEGER, allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      trash: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
    // Add composite unique constraint
    await queryInterface.addConstraint("attendance", {
      fields: ["school_id", "class_id", "period", "date"],
      type: "unique",
      name: "unique_class_combination",
    });
    await queryInterface.addIndex("attendance", ["school_id"], {
      name: "attendance_school_id_idx",
    });
    await queryInterface.addIndex("attendance", ["class_id"], {
      name: "attendance_class_id_idx",
    });
    await queryInterface.addIndex("attendance", ["subject_id"], {
      name: "attendance_subject_id_idx",
    });
    await queryInterface.addIndex("attendance", ["date"], {
      name: "attendance_date_idx",
    });
    await queryInterface.addIndex("attendance", ["trash"], {
      name: "attendance_trash_idx",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("attendance");
  },
};
