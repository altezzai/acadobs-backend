"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("students", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      guardian_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      class_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "classes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      reg_no: { type: Sequelize.STRING, unique: true },
      roll_number: { type: Sequelize.INTEGER, allowNull: false },
      full_name: { type: Sequelize.STRING, allowNull: false },
      date_of_birth: { type: Sequelize.DATE },
      gender: { type: Sequelize.ENUM("male", "female", "other") },
      admission_date: { type: Sequelize.DATE },
      address: { type: Sequelize.STRING },
      status: {
        type: Sequelize.ENUM("active", "inactive"),
        defaultValue: "active",
      },
      image: { type: Sequelize.STRING },
      alumni: { type: Sequelize.BOOLEAN, defaultValue: false },
      trash: { type: Sequelize.BOOLEAN, defaultValue: false },
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
    await queryInterface.addIndex("students", ["school_id"], {
      name: "students_school_id_idx",
    });
    await queryInterface.addIndex("students", ["guardian_id"], {
      name: "students_guardian_id_idx",
    });
    await queryInterface.addIndex("students", ["class_id"], {
      name: "students_class_id_idx",
    });
    await queryInterface.addIndex("students", ["roll_number"], {
      name: "students_roll_number_idx",
    });
    await queryInterface.addIndex("students", ["full_name"], {
      name: "students_full_name_idx",
    });
    await queryInterface.addIndex("students", ["trash"], {
      name: "students_trash_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("students");
    await queryInterface.removeIndex("students", "students_school_id_idx");
    await queryInterface.removeIndex("students", "students_guardian_id_idx");
    await queryInterface.removeIndex("students", "students_class_id_idx");
    await queryInterface.removeIndex("students", "students_roll_number_idx");
    await queryInterface.removeIndex("students", "students_full_name_idx");
    await queryInterface.removeIndex("students", "students_trash_idx");
  },
};
