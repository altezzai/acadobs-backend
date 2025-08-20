const messageHandlers = require("./messageHandlers");
const messageStatusHandlers = require("./messageStatusHandlers");

module.exports = (io, socket) => {
  console.log(`User connected: ${socket.user.user_id}`);

  socket.on("getUserConversations", (data) =>
    messageHandlers.getUserConversations(io, socket, data)
  );

  // 🟢 Message Handlers
  socket.on("sendMessage", (data) =>
    messageHandlers.sendMessage(io, socket, data)
  );
  socket.on("deleteMessage", (data) =>
    messageHandlers.deleteMessage(io, socket, data)
  );
  socket.on("getMessages", (data) =>
    messageHandlers.getMessages(io, socket, data)
  );
  socket.on("getFirstUnseenMessage", (data) =>
    messageHandlers.getFirstUnseenMessage(io, socket, data)
  );

  // 🟢 Message Status Handlers
  socket.on("messageReceived", (data) =>
    messageStatusHandlers.messageReceived(io, socket, data)
  );
  socket.on("messageRead", (data) =>
    messageStatusHandlers.messageRead(io, socket, data)
  );
  // 🟢 Personal Handlers
  socket.on("toggleBlock", (data) =>
    personalHandlers.toggleBlock(io, socket, data)
  );

  // 🟢 Disconnect Event
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.user_id}`);
  });
};
