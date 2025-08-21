const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const http = require("http"); // Import HTTP module for Socket.IO
const { Server } = require("socket.io"); // Import Socket.IO
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 4444;
const { auth, socketAuth } = require("./middlewares/authMiddleware");
const limiter = require("./middlewares/rateLimitMiddleware");

const server = http.createServer(app); // Wrap Express with HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (Adjust as needed)
    methods: ["GET", "POST"],
  },
});
const SuperadminRoutes = require("./routes/superAdminRoutes");
const SchooladminRoutes = require("./routes/schoolAdminRoutes");
const StaffRoutes = require("./routes/staffRoutes");
const GuardianRoutes = require("./routes/guardianRoutes");

// Apply Middleware
app.use(helmet());
app.use(
  cors({
    origin: "*",
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

app.use("/uploads", express.static("uploads"));

app.use("/api/s1/superadmin", auth, SuperadminRoutes);
app.use("/api/s1/schooladmin", auth, SchooladminRoutes);
app.use("/api/s1/staff", auth, StaffRoutes);
app.use("/api/s1/guardian", auth, GuardianRoutes);

// Add other routes similarly...
const socketHandlers = require("./socketHandlers/socket");

io.use(async (socket, next) => {
  try {
    await socketAuth(socket, next);

    if (socket.user && socket.user.user_id) {
      socket.join(`user_${socket.user.user_id}`);
      console.log(
        `User ${socket.user.user_id} joined room user_${socket.user.user_id}`
      );
    }
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(
    `⚡ User Connected: ${socket.id} (User ID: ${socket.user?.user_id})`
  );
  socketHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}/api/s1/...`);
});
