// handlers/messageStatusHandlers.js
const Message = require("../models/messages");

const messageStatusHandlers = {
  // ✅ When receiver confirms they received the message
  async messageReceived(io, socket, data) {
    try {
      const { messageId, receiverId } = data;

      // Update status in DB
      await Message.update(
        { status: "received" },
        { where: { id: messageId, receiver_id: receiverId } }
      );

      // Emit event back to sender
      io.emit("messageStatusUpdated", {
        messageId,
        status: "received",
      });

      console.log(
        `✅ Message ${messageId} marked as received by user ${receiverId}`
      );
    } catch (error) {
      console.error("❌ Error in messageReceived:", error);
    }
  },

  // ✅ When receiver reads the message
  async messageRead(io, socket, data) {
    try {
      const { messageId, receiverId } = data;

      // Update status in DB
      await Message.update(
        { status: "read" },
        { where: { id: messageId, receiver_id: receiverId } }
      );

      // Emit event back to sender
      io.emit("messageStatusUpdated", {
        messageId,
        status: "read",
      });

      console.log(
        `👀 Message ${messageId} marked as read by user ${receiverId}`
      );
    } catch (error) {
      console.error("❌ Error in messageRead:", error);
    }
  },
};

module.exports = messageStatusHandlers;
