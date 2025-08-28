// handlers/messageStatusHandlers.js
const Message = require("../models/messages");
const { Op } = require("sequelize");

const messageStatusHandlers = {
  async messageReceived(io, socket, data) {
    try {
      const userId = socket.user.user_id;
      const { chat_id } = data;

      const [updatedCount] = await Message.update(
        { status: "received" },
        {
          where: {
            chat_id,
            status: "sent",
            receiver_id: userId,
          },
        }
      );
      console.log(
        `Message status updated to received for user ${userId} from chat ${chat_id}`
      );
      if (updatedCount === 0) {
        return socket.emit("error", { message: "Message not found" });
      }

      io.emit("messageStatusUpdated", {
        chat_id,
        status: "received",
      });

      io.to(`user_${userId}`).emit("messageStatusUpdate", {
        status: "received",
      });
    } catch (error) {
      console.error(error);
      socket.emit("error", { message: "Failed to update message status" });
    }
  },

  async messageRead(io, socket, data) {
    try {
      const userId = socket.user.user_id;
      const { chat_id } = data;
      const [updatedCount] = await Message.update(
        { status: "read" },
        {
          where: {
            chat_id,
            receiver_id: userId,
            status: { [Op.ne]: "read" },
          },
        }
      );
      if (updatedCount === 0) {
        return socket.emit("error", { message: "Message not found" });
      }

      io.emit("messageStatusUpdated", {
        chat_id,
        status: "read",
      });

      console.log(`👀 Message ${chat_id} marked as read by user ${userId}`);
    } catch (error) {
      console.error(" Error in messageRead:", error);
    }
  },
};

module.exports = messageStatusHandlers;
