"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("homeworks", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
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
        allowNull: false,
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
      title: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT, allowNull: true },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      file: Sequelize.STRING,
      type: {
        type: Sequelize.ENUM("online", "offline"),
        allowNull: true,
      },
      trash: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    await queryInterface.addConstraint("homeworks", {
      fields: [
        "school_id",
        "teacher_id",
        "class_id",
        "subject_id",
        "due_date",
        "title",
      ],
      type: "unique",
      name: "unique_homework_combination",
    });
    await queryInterface.addIndex("homeworks", ["school_id"], {
      name: "homeworks_school_id_idx",
    });
    await queryInterface.addIndex("homeworks", ["teacher_id"], {
      name: "homeworks_teacher_id_idx",
    });
    await queryInterface.addIndex("homeworks", ["class_id"], {
      name: "homeworks_class_id_idx",
    });
    await queryInterface.addIndex("homeworks", ["subject_id"], {
      name: "homeworks_subject_id_idx",
    });
    await queryInterface.addIndex("homeworks", ["title"], {
      name: "homeworks_title_idx",
    });
    await queryInterface.addIndex("homeworks", ["trash"], {
      name: "homeworks_trash_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("homeworks");
  },
};
