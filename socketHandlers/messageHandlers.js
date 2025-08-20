const { Op } = require("sequelize");
const Message = require("../models/messages");
const { User } = require("../models"); // import models

const sendMessage = async (data, callback) => {
  try {
    const sender_id = socket.user_id; // Get sender_id from socket userId
    const {
      receiver_id,
      student_id,
      message,

      mediaUrl,
      replyToId,
      type,
      type_id,
    } = data;

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

    // Emit message to receiver in real-time
    io.to(receiver_id.toString()).emit("newMessage", newMessage);

    if (callback) callback({ success: true, message: newMessage });
  } catch (error) {
    console.error("sendMessage error:", error);
    if (callback) callback({ success: false, error: "Failed to send message" });
  }
};

/**
 * ❌ Delete Message
 */
const deleteMessage = async (data, callback) => {
  try {
    const { id, sender_id } = data;

    const msg = await Message.findOne({ where: { id, sender_id } });
    if (!msg)
      return callback({
        success: false,
        error: "Message not found or not allowed",
      });

    await msg.destroy();

    io.to(msg.receiver_id.toString()).emit("deleteMessage", { id });

    callback({ success: true, id });
  } catch (error) {
    console.error("deleteMessage error:", error);
    callback({ success: false, error: "Failed to delete message" });
  }
};

/**
 * 📥 Get All Messages between two users
 */
const getMessages = async (data, callback) => {
  try {
    const user1 = socket.user_id; // Get user1 from socket userId
    const { user2 } = data;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: user1, receiver_id: user2 },
          { sender_id: user2, receiver_id: user1 },
        ],
      },
      order: [["created_at", "ASC"]],
    });

    callback({ success: true, messages });
  } catch (error) {
    console.error("getMessages error:", error);
    callback({ success: false, error: "Failed to fetch messages" });
  }
};

/**
 * 👀 Get First Unseen Message
 */
const getFirstUnseenMessage = async (data, callback) => {
  try {
    const userId = socket.user_id; // Get userId from socket userId
    const { opponentId } = data;

    const message = await Message.findOne({
      where: {
        [Op.or]: [
          { sender_id: userId, receiver_id: opponentId },
          { sender_id: opponentId, receiver_id: userId },
        ],
        status: "sent",
      },
      order: [["created_at", "ASC"]],
    });

    if (message) {
      // Mark as received
      await message.update({ status: "received" });
    }

    callback({ success: true, message });
  } catch (error) {
    console.error("getFirstUnseenMessage error:", error);
    callback({ success: false, error: "Failed to fetch unseen message" });
  }
};

/**
 * 🧑‍🤝‍🧑 Get Users List with Latest Message
 */
const getUsersListandLatestMessage = async (data, callback) => {
  try {
    const userId = socket.user_id;

    const latestMessages = await Message.findAll({
      attributes: [
        "id",
        "sender_id",
        "receiver_id",
        "message",
        "status",
        "created_at",
      ],
      where: {
        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
      },
      order: [["created_at", "DESC"]],
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
    const users = await User.findAll({ where: { id: userIds } });

    const result = users.map((user) => ({
      user,
      latestMessage: userMap[user.id],
    }));

    callback({ success: true, list: result });
  } catch (error) {
    console.error("getUsersListandLatestMessage error:", error);
    callback({ success: false, error: "Failed to fetch users list" });
  }
};

module.exports = {
  sendMessage,
  deleteMessage,
  getMessages,
  getFirstUnseenMessage,
  getUsersListandLatestMessage,
};
