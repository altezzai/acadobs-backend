//i want set jwt login and signup page
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
const { User, Session, Otp, sequelize } = require("../models");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const logger = require("../utils/logger");
const crypto = require("crypto");
const School = require("../models/school");
const { sendOTPWithMsg91 } = require("../utils/smsService");
const jwtExpTime = process.env.JWT_EXP_TIME || "60m";
const expiredDays = process.env.EXPIRED_DAYS || 90;
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
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
    expiresAt.setDate(expiresAt.getDate() + expiredDays);
    
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
        sessionId: currentSession.id,
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
        sessionId: session.id, 
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

const forgotPassword = async (req, res) => {
  try {
    const identifier = req.body.phone || req.body.identifier;
    if (!identifier) {
      return res.status(400).json({ message: "Phone number or identifier is required" });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }],
        trash: false,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "No active user found with provided details" });
    }

    if (!user.phone) {
      return res.status(400).json({ message: "No registered phone number found for this account" });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const ttlMs = 5 * 60 * 1000; // 5 minutes TTL
    const expiresAt = new Date(Date.now() + ttlMs);

    await Otp.destroy({ where: { phone: user.phone } });

    await Otp.create({
      phone: user.phone,
      otp,
      expires_at: expiresAt,
      verified: false,
    });
    await sendOTPWithMsg91(user.phone, otp, ttlMs, process.env.MSG91_OTP_TEMPLATE_ID);

    const maskedPhone = user.phone.replace(/(\d{2,3})\d{4,5}(\d{2,3})/, "$1****$2");

    res.status(200).json({
      message: "OTP sent successfully to registered mobile number",
      phone: maskedPhone,
    });
  } catch (error) {
    logger.error("Error in forgotPassword:", error);
    res.status(500).json({ error: error.message || "Failed to process forgot password request" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const identifier = req.body.phone || req.body.identifier;
    const { otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: "Phone/identifier and OTP are required" });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }],
        trash: false,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpRecord = await Otp.findOne({
      where: {
        phone: user.phone,
        otp: otp.toString().trim(),
        verified: false,
        expires_at: { [Op.gt]: new Date() },
      },
      order: [["createdAt", "DESC"]],
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const resetToken = jwt.sign(
      {
        user_id: user.id,
        phone: user.phone,
        purpose: "password_reset",
      },
      secretKey,
      { expiresIn: "10m" }
    );

    res.status(200).json({
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    logger.error("Error in verifyOtp:", error);
    res.status(500).json({ error: error.message || "Failed to verify OTP" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { newPassword, resetToken, otp } = req.body;
    const identifier = req.body.phone || req.body.identifier;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    let user = null;

    if (resetToken) {
      let decoded;
      try {
        decoded = jwt.verify(resetToken, secretKey);
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired reset token" });
      }

      if (decoded.purpose !== "password_reset") {
        return res.status(401).json({ message: "Invalid token purpose" });
      }

      user = await User.findOne({
        where: { id: decoded.user_id, trash: false },
      });
    } else if (identifier && otp) {
      user = await User.findOne({
        where: {
          [Op.or]: [{ email: identifier }, { phone: identifier }],
          trash: false,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const otpRecord = await Otp.findOne({
        where: {
          phone: user.phone,
          otp: otp.toString().trim(),
          expires_at: { [Op.gt]: new Date() },
        },
        order: [["createdAt", "DESC"]],
      });

      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
    } else {
      return res.status(400).json({
        message: "Either resetToken or identifier with OTP must be provided",
      });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await Otp.destroy({ where: { phone: user.phone } });
    await Session.destroy({ where: { user_id: user.id } });

    res.status(200).json({
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    logger.error("Error in resetPassword:", error);
    res.status(500).json({ error: error.message || "Failed to reset password" });
  }
};

const resendOtp = forgotPassword;

module.exports = {
  login,
  refreshToken,
  logout,
  getSchoolsList,
  forgotPassword,
  verifyOtp,
  resetPassword,
  resendOtp,
  sendOTPWithMsg91,
};
