const { Op } = require("sequelize");
const Message = require("../models/messages");
const { User } = require("../models");

// import models

const sendMessage = async (io, socket, data) => {
  try {
    const sender_id = socket.user.user_id; // must be set in socket auth middleware
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

    const newMessage = await Message.create({
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

    // Send back to sender
    socket.emit("newMessage", newMessage);

    // Send to receiver (join users to rooms when they connect!)
    io.to(`user_${receiver_id}`).emit("newMessage", newMessage);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    socket.emit("error", {
      message: error.message || "Failed to send message!",
    });
  }
};

/**
 * ❌ Delete Message
 */
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

/**
 * 📥 Get All Messages between two users
 */
const getMessages = async (io, socket, data) => {
  try {
    const user1 = socket.user.user_id; // Get user1 from socket userId
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

/**
 * 👀 Get First Unseen Message
 */
const getFirstUnseenMessage = async (io, socket, data) => {
  try {
    const userId = socket.user.user_id; // Get the current user ID
    const { opponentId } = data; // Get opponent ID from request

    if (!opponentId) {
      return socket.emit("error", { message: "Opponent ID is required" });
    }
    const messages = await Message.findOne({
      where: {
        [Op.or]: [
          { sender_id: userId, receiver_id: opponentId },
          { sender_id: opponentId, receiver_id: userId },
          { status: "sent" }, // Unseen messages sent to me
        ],
      },
      order: [["createdAt", "ASC"]], // Sort by sent_date in ascending order
    });

    socket.emit("getFirstunseen", messages);
  } catch (error) {
    console.error(error);
    socket.emit("error", { message: "Failed to retrieve new messages" });
  }
};

/**
 * 🧑‍🤝‍🧑 Get Users List with Latest Message
 */
const getUsersListandLatestMessage = async (io, socket, data) => {
  try {
    const userId = socket.user.user_id;
    console.log("Fetching users list for userId:", userId);
    const { page = 1, limit = 10, search } = data || {};
    const offset = (page - 1) * limit;
    const whereCondition = {
      [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
    };
    if (search) {
      whereCondition[Op.or].push({
        message: {
          [Op.like]: `%${search}%`,
        },
      });
    }

    const { count, rows: latestMessages } = await Message.findAndCountAll({
      limit,
      offset,
      distinct: true,
      where: whereCondition,
      attributes: [
        "id",
        "sender_id",
        "student_id",
        "receiver_id",
        "message",
        "status",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });
    // Distinct users with latest message
    const userMap = {};
    latestMessages.forEach((msg) => {
      const otherUser =
        msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!userMap[otherUser]) {
        userMap[otherUser] = msg;
      }
    });

    // Fetch user details
    const userIds = Object.keys(userMap);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "name", "dp"],
    });

    const result = users.map((user) => ({
      user,
      latestMessage: userMap[user.id],
    }));

    socket.emit("usersList", {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: result,
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
