"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("sessions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      refresh_token: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
      },
      device_info: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    await queryInterface.addIndex("sessions", ["refresh_token"], {
      name: "sessions_refresh_token_idx",
    });
    await queryInterface.addIndex("sessions", ["user_id"], {
      name: "sessions_user_id_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("sessions");
  },
};
