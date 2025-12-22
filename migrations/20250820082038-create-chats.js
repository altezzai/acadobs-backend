"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("chats", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user1_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      user2_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      last_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Ensure that user1_id and user2_id combination is unique
    await queryInterface.addIndex("chats", ["user1_id", "user2_id"], {
      unique: true,
      name: "unique_user_pair",
    });
    await queryInterface.addIndex("chats", ["user1_id"], {
      name: "chats_user1_id_idx",
    });
    await queryInterface.addIndex("chats", ["user2_id"], {
      name: "chats_user2_id_idx",
    });
    await queryInterface.addIndex("chats", ["last_message"], {
      name: "chats_last_message_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("chats");
    await queryInterface.removeIndex("chats", "unique_user_pair");
    await queryInterface.removeIndex("chats", "chats_user1_id_idx");
    await queryInterface.removeIndex("chats", "chats_user2_id_idx");
    await queryInterface.removeIndex("chats", "chats_last_message_idx");
  },
};
