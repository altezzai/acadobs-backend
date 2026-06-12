const jwt = require("jsonwebtoken");
const { Session } = require("../models");
const secretKey = process.env.JWT_SECRET;

const auth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(401).send({ message: "Unauthorized" });

  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) return res.status(401).send({ message: "Unauthorized: Token expired or invalid" });
    
    if (decoded.sessionId) {
      try {
        const session = await Session.findByPk(decoded.sessionId);
        if (!session || session.user_id !== decoded.user_id) {
          return res.status(401).send({ message: "Unauthorized: Session expired or logged in from another device" });
        }
      } catch (dbErr) {
        return res.status(500).send({ message: "Internal server error" });
      }
    }
    
    req.user = decoded;
    next();
  });
};

const socketAuth = (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: Access Token Required"));
    }

    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return next(
          new Error("Authentication error: Invalid or Expired Token"),
        );
      }
      
      if (decoded.sessionId) {
        try {
          const session = await Session.findByPk(decoded.sessionId);
          if (!session || session.user_id !== decoded.user_id) {
            return next(new Error("Authentication error: Session expired or invalid"));
          }
        } catch (dbErr) {
          return next(new Error("Authentication error: Server error"));
        }
      }

      socket.user = decoded;
      next();
    });
  } catch (err) {
    next(new Error("Authentication error"));
  }
};

// const socketAuth = (socket, next) => {
//   socket.user = {
//     user_id: 1,
//   };
//   next();
// };

// const auth = (req, res, next) => {
//   req.user = {
//     user_id: 2,
//     school_id: 1,
//     dp: "default.png",
//     name: "default user1",
//     role: "user",
//   };

//   next();
// };

module.exports = { socketAuth, auth };
