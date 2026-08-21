'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exam_timetables', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      exam_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'exams',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      subject_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'subjects',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      standard: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      exam_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      start_time: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      max_marks: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },
      pass_marks: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'ongoing', 'completed', 'cancelled','published'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      recorded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      trash: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('exam_timetables', ['school_id'], {
      name: 'exam_timetables_school_id_idx',
    });
    await queryInterface.addIndex('exam_timetables', ['exam_id'], {
      name: 'exam_timetables_exam_id_idx',
    });
    await queryInterface.addIndex('exam_timetables', ['subject_id'], {
      name: 'exam_timetables_subject_id_idx',
    });
    await queryInterface.addIndex('exam_timetables', ['exam_date'], {
      name: 'exam_timetables_exam_date_idx',
    });
    await queryInterface.addIndex('exam_timetables', ['trash'], {
      name: 'exam_timetables_trash_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('exam_timetables');
  },
};
