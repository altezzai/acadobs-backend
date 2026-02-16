const messageHandlers = require("./messageHandlers");
const messageStatusHandlers = require("./messageStatusHandlers");

module.exports = (io, socket) => {
  console.log(`User connected: ${socket.user.user_id}`);

  socket.on("getUsersListandLatestMessage", (data) =>
    messageHandlers.getUsersListandLatestMessage(io, socket, data)
  );

  //  Message Handlers
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

  //  Message Status Handlers
  socket.on("messageReceived", (data) =>
    messageStatusHandlers.messageReceived(io, socket, data)
  );
  socket.on("messageRead", (data) =>
    messageStatusHandlers.messageRead(io, socket, data)
  );
  //  Personal Handlers
  socket.on("toggleBlock", (data) =>
    personalHandlers.toggleBlock(io, socket, data)
  );

  socket.on("joinRouteRoom", ({ route_id }) => {
    socket.join(`route_${route_id}`);
    console.log(`User ${socket.user.user_id} joined route_${route_id}`);
  });

  // Vehicle live tracking
  socket.on("vehicleLocationUpdate", (data) =>
    vehicleHandlers.vehicleLocationUpdate(io, socket, data)
  );

  socket.on("stopArrived", (data) =>
    vehicleHandlers.stopArrived(io, socket, data)
  );

  socket.on("routeCompleted", (data) =>
    vehicleHandlers.routeCompleted(io, socket, data)
  );

  //  Disconnect Event
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.user_id}`);
  });
};
