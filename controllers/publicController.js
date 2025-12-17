//i want set jwt login and signup page
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
const { User, sequelize } = require("../models");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const logger = require("../utils/logger");

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
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        user_id: user.id,
        role: user.role,
        school_id: user.school_id,
        name: user.name,
        dp: user.dp,
      },
      secretKey,
      { expiresIn: "360h" }
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
    res.status(200).json({ message: "Login successful", token, userData });
  } catch (err) {
    logger.error("Error logging in:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  login,
};
