//i want set jwt login and signup page
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
const { User, Session, sequelize } = require("../models");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const logger = require("../utils/logger");
const crypto = require("crypto");
const  School  = require("../models/school");
const jwtExpTime = process.env.JWT_EXP_TIME || "15m"; // Default to 15 minutes if not set

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

    // await Session.destroy({ where: { user_id: user.id } });

    const refreshToken = crypto.randomBytes(40).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
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
        sessionId: currentSession.id, // Embed session id!
      },
      secretKey,
      { expiresIn: jwtExpTime }
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
  } catch (error) {
    logger.error("Error logging in:", error);
    res.status(500).json({ error: error.message });
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
      { expiresIn:jwtExpTime }
    );

    res.status(200).json({ token, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error("Error refreshing token:", error);
    res.status(500).json({ error: error.message });
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
  } catch (error) {
    logger.error("Error during logout:", error);
    res.status(500).json({ error: error.message });
  }
}
const getSchoolsList = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: schools } = await School.findAndCountAll({
      offset,
      distinct: true,
      limit,
      attributes: ["id", "name", "logo"],
      where: {
        name: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      schools,
    });
  } catch (error) {
    logger.error("Error getting schools:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getSchoolsList,
};
