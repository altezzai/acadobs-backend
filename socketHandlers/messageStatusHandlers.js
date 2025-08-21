// handlers/messageStatusHandlers.js
const Message = require("../models/messages");
const { Op } = require("sequelize");

const messageStatusHandlers = {
  // ✅ When receiver confirms they received the message
  async messageReceived(io, socket, data) {
    try {
      const userId = socket.user.user_id;
      const { opponentId } = data;

      const [updatedCount] = await Message.update(
        { status: "received" },
        {
          where: {
            sender_id: opponentId,
            status: "sent",
            receiver_id: userId,
          },
        }
      );
      console.log(
        `Message status updated to received for user ${userId} from opponent ${opponentId}`
      );
      if (updatedCount === 0) {
        return socket.emit("error", { message: "Message not found" });
      }

      // Emit event back to sender
      io.emit("messageStatusUpdated", {
        opponentId,
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

  // ✅ When receiver reads the message
  async messageRead(io, socket, data) {
    try {
      const userId = socket.user.user_id;
      const { opponentId } = data;
      const [updatedCount] = await Message.update(
        { status: "read" },
        {
          where: {
            sender_id: opponentId,
            receiver_id: userId,
            status: { [Op.ne]: "read" },
          },
        }
      );
      if (updatedCount === 0) {
        return socket.emit("error", { message: "Message not found" });
      }

      // Emit event back to sender
      io.emit("messageStatusUpdated", {
        opponentId,
        status: "read",
      });

      console.log(`👀 Message ${opponentId} marked as read by user ${userId}`);
    } catch (error) {
      console.error("❌ Error in messageRead:", error);
    }
  },
};

module.exports = messageStatusHandlers;
