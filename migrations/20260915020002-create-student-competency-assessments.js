"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("student_competency_assessments", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "students",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      exam_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "exams",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      competency_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "competencies",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      indicator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "competency_indicators",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      rating: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      recorded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    await queryInterface.addConstraint("student_competency_assessments", {
      fields: ["student_id", "exam_id", "indicator_id"],
      type: "unique",
      name: "unique_student_indicator_exam",
    });

    await queryInterface.addIndex("student_competency_assessments", ["school_id"], {
      name: "student_competency_assessments_school_id_idx",
    });
    await queryInterface.addIndex("student_competency_assessments", ["student_id"], {
      name: "student_competency_assessments_student_id_idx",
    });
    await queryInterface.addIndex("student_competency_assessments", ["exam_id"], {
      name: "student_competency_assessments_exam_id_idx",
    });
    await queryInterface.addIndex("student_competency_assessments", ["competency_id"], {
      name: "student_competency_assessments_competency_id_idx",
    });
    await queryInterface.addIndex("student_competency_assessments", ["indicator_id"], {
      name: "student_competency_assessments_indicator_id_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("student_competency_assessments");
  },
};
