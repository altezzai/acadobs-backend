//i want set jwt login and signup page
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
const { User, Session, sequelize } = require("../models");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const logger = require("../utils/logger");
const crypto = require("crypto");

// Login controller
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Identifier and password are required." });
    }
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }],
        trash: false,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Enforce single session: destroy any existing session for this user
    await Session.destroy({ where: { user_id: user.id } });

    // Create a new refresh token
    const refreshToken = crypto.randomBytes(40).toString("hex");

    // Save session in database mapping it to the user. Expire in 7 days.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // We can also extract IP & Device Info from req (if available)
    const ip_address = req.ip || req.connection.remoteAddress;
    const device_info = req.headers["user-agent"];

    const currentSession = await Session.create({
      user_id: user.id,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      ip_address,
      device_info,
    });

    const token = jwt.sign(
      {
        user_id: user.id,
        role: user.role,
        school_id: user.school_id,
        name: user.name,
        dp: user.dp,
        sessionId: currentSession.id, // Embed session id!
      },
      secretKey,
      { expiresIn: "15m" }
    );
    const userData = {
      user_id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      school_id: user.school_id,
      dp: user.dp,

    };
    res.status(200).json({ message: "Login successful", token, refreshToken, userData });
  } catch (err) {
    logger.error("Error logging in:", err);
    res.status(500).json({ error: err.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const session = await Session.findOne({ 
      where: { refresh_token: refreshToken },
      include: [User]
    });

    if (!session) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (new Date() > session.expires_at) {
      await session.destroy();
      return res.status(401).json({ message: "Refresh token expired" });
    }

    const user = session.User;
    
    // Rotate refresh token for added security
    const newRefreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    session.refresh_token = newRefreshToken;
    session.expires_at = expiresAt;
    await session.save();

    const token = jwt.sign(
      {
        user_id: user.id,
        role: user.role,
        school_id: user.school_id,
        name: user.name,
        dp: user.dp,
        sessionId: session.id, // Embed session id
      },
      secretKey,
      { expiresIn: "15m" }
    );

    res.status(200).json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    logger.error("Error refreshing token:", err);
    res.status(500).json({ error: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
    
    const deleted = await Session.destroy({ where: { refresh_token: refreshToken } });
    
    if (!deleted) {
      return res.status(400).json({ message: "Session not found or already logged out" });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    logger.error("Error during logout:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  login,
  refreshToken,
  logout
};
