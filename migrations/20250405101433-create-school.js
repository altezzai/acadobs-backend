"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("schools", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      logo: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      period_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 2,
      },
      attendance_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 2,
      },
      syllabus_type: {
        type: Sequelize.ENUM("CBSE", "ICSE", "Kerala State", "IB", "Other"),
        allowNull: true,
        defaultValue: "CBSE",
      },
      education_year_start: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive"),
        defaultValue: "active",
      },
      trash: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addIndex("schools", ["name"], {
      name: "schools_name_idx",
    });
    await queryInterface.addIndex("schools", ["email"], {
      name: "schools_email_idx",
    });
    await queryInterface.addIndex("schools", ["phone"], {
      name: "schools_phone_idx",
    });
    await queryInterface.addIndex("schools", ["trash"], {
      name: "schools_trash_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("schools");
    await queryInterface.removeIndex("schools", "schools_name_idx");
    await queryInterface.removeIndex("schools", "schools_email_idx");
    await queryInterface.removeIndex("schools", "schools_phone_idx");
    await queryInterface.removeIndex("schools", "schools_trash_idx");
  },
};
