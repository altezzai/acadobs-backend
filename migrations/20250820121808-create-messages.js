"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("messages", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chat_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "chats",
          key: "id",
        },
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      receiver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "students",
          key: "id",
        },
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mediaUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      replyToId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("sent", "received", "read"),
        defaultValue: "sent",
      },
      type: {
        type: Sequelize.ENUM(
          "msg",
          "homeworks",
          "parent_notes",
          "internal_marks",
          "attendance",
          "achievements",
          "leave_requests",
          "payments",
          "events",
          "notices",
          "news"
        ),
        defaultValue: "msg",
      },
      type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      trash: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    await queryInterface.addIndex("messages", ["chat_id"], {
      name: "messages_chat_id_idx",
    });
    await queryInterface.addIndex("messages", ["sender_id"], {
      name: "messages_sender_id_idx",
    });
    await queryInterface.addIndex("messages", ["receiver_id"], {
      name: "messages_receiver_id_idx",
    });
    await queryInterface.addIndex("messages", ["student_id"], {
      name: "messages_student_id_idx",
    });
    await queryInterface.addIndex("messages", ["type"], {
      name: "messages_type_idx",
    });
    await queryInterface.addIndex("messages", ["type_id"], {
      name: "messages_type_id_idx",
    });
    await queryInterface.addIndex("messages", ["trash"], {
      name: "messages_trash_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("messages");
    await queryInterface.removeIndex("messages", "messages_chat_id_idx");
    await queryInterface.removeIndex("messages", "messages_sender_id_idx");
    await queryInterface.removeIndex("messages", "messages_receiver_id_idx");
    await queryInterface.removeIndex("messages", "messages_student_id_idx");
    await queryInterface.removeIndex("messages", "messages_type_idx");
    await queryInterface.removeIndex("messages", "messages_type_id_idx");
    await queryInterface.removeIndex("messages", "messages_trash_idx");
  },
};
