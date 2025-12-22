"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM(
          "superadmin",
          "admin",
          "teacher",
          "staff",
          "guardian"
        ),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive"),
        defaultValue: "active",
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    await queryInterface.addIndex("users", ["email"], {
      name: "users_email_idx",
    });
    await queryInterface.addIndex("users", ["phone"], {
      name: "users_phone_idx",
    });
    await queryInterface.addIndex(
      "users",
      ["school_id", "role", "dp", "trash"],
      {
        name: "users_school_id_role_dp_trash_idx",
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    // It's good practice to remove indexes in the down migration
    await queryInterface.removeIndex("users", "users_email_idx");
    await queryInterface.removeIndex("users", "users_phone_idx");
    await queryInterface.removeIndex(
      "users",
      "users_school_id_role_dp_trash_idx"
    );
    await queryInterface.dropTable("users");
  },
};
