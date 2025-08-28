const { Op } = require("sequelize");
const Message = require("../models/messages");
const { User } = require("../models");
const Chat = require("../models/chat");
const Sequelize = require("sequelize");

// import models

const sendMessage = async (io, socket, data) => {
  try {
    const sender_id = socket.user.user_id;
    const {
      receiver_id,
      student_id,
      message,
      mediaUrl,
      replyToId,
      type,
      type_id,
    } = data;

    if (!receiver_id) {
      throw new Error("receiver_id is required");
    }

    let chat = await Chat.findOne({
      where: {
        [Op.or]: [
          { user1_id: sender_id, user2_id: receiver_id },
          { user1_id: receiver_id, user2_id: sender_id },
        ],
      },
    });

    if (!chat) {
      chat = await Chat.create({
        user1_id: sender_id,
        user2_id: receiver_id,
        last_message: message ? message : mediaUrl ? "media" : null,
      });
    } else {
      await chat.update({
        last_message: message || (mediaUrl ? "media" : chat.last_message),
      });
    }
    const newMessage = await Message.create({
      chat_id: chat.id,
      sender_id,
      receiver_id,
      student_id,
      message,
      mediaUrl,
      replyToId,
      type,
      type_id,
      status: "sent",
    });

    socket.emit("newMessage", newMessage);

    io.to(`user_${receiver_id}`).emit("newMessage", newMessage);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    socket.emit("error", {
      message: error.message || "Failed to send message!",
    });
  }
};

const deleteMessage = async (io, socket, data) => {
  try {
    const userId = socket.user.user_id;
    const id = data.messageId;

    const msg = await Message.findOne({ where: { id, sender_id: userId } });
    if (!msg) {
      return socket.emit("error", {
        message: "Message not found or unauthorized",
      });
    }

    await msg.destroy();
    socket.emit("messageDeleted", { messageId: id, status: "deleted" });
    io.to(`user_${msg.receiver_id}`).emit("messageDeleted", { messageId: id });
  } catch (error) {
    console.error(error);
    socket.emit("error", { message: "Failed to delete message" });
  }
};

const getMessages = async (io, socket, data) => {
  try {
    const user1 = socket.user.user_id;
    const { opponentId } = data;

    const messageData = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: user1, receiver_id: opponentId },
          { sender_id: opponentId, receiver_id: user1 },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    socket.emit("messages", messageData);
  } catch (error) {
    console.error(error);
    socket.emit("error", {
      message: "Failed to retrieve messages from getMessages",
    });
  }
};

const getFirstUnseenMessage = async (io, socket, data) => {
  try {
    const userId = socket.user.user_id;
    const { opponentId } = data;

    if (!opponentId) {
      return socket.emit("error", { message: "Opponent ID is required" });
    }
    const messages = await Message.findOne({
      where: {
        [Op.or]: [
          { sender_id: userId, receiver_id: opponentId },
          { sender_id: opponentId, receiver_id: userId },
          { status: "sent" },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    socket.emit("getFirstunseen", messages);
  } catch (error) {
    console.error(error);
    socket.emit("error", { message: "Failed to retrieve new messages" });
  }
};

const getUsersListandLatestMessage = async (io, socket, data) => {
  try {
    const user_id = socket.user.user_id;
    const { page = 1, limit = 10, search } = data || {};
    const offset = (page - 1) * limit;

    let whereCondition = {
      [Op.or]: [{ user1_id: user_id }, { user2_id: user_id }],
    };

    const { count, rows: conversations } = await Chat.findAndCountAll({
      limit,
      offset,
      distinct: true,
      where: whereCondition,
      include: [
        {
          model: User,
          as: "user1",
          attributes: ["id", "name", "dp"],
        },
        {
          model: User,
          as: "user2",
          attributes: ["id", "name", "dp"],
        },
      ],
      attributes: [
        "id",
        "user1_id",
        "user2_id",
        "last_message",
        "updatedAt",
        [
          Sequelize.literal(`(
              SELECT COUNT(*)
              FROM messages
              WHERE messages.chat_id = Chat.id
              AND messages.sender_id != ${user_id}
              AND messages.status IN ('sent', 'received')
            )`),
          "unread_count",
        ],
      ],
      order: [["updatedAt", "DESC"]],
    });

    const formattedConversations = conversations.map((chat) => {
      let opponent;

      if (chat.user1_id === user_id) {
        opponent = chat.user2;
      } else {
        opponent = chat.user1;
      }

      return {
        chat_id: chat.id,
        last_message: chat.last_message,
        updatedAt: chat.updatedAt,
        unread_count: chat.dataValues.unread_count,
        opponent: opponent,
      };
    });

    socket.emit("usersList", {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error(error);
    socket.emit("error", { message: "Failed to fetch conversations" });
  }
};

module.exports = {
  sendMessage,
  deleteMessage,
  getMessages,
  getFirstUnseenMessage,
  getUsersListandLatestMessage,
};
