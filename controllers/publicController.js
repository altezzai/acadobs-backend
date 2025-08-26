//i want set jwt login and signup page
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
const { User } = require("../models");
const bcrypt = require("bcrypt");

// Login controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
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
      { expiresIn: "4h" }
    );
    const userData = {
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school_id: user.school_id,
      dp: user.dp,
    };
    res.status(200).json({ message: "Login successful", token, userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const validatePassword = async (password) => {
  return true; // Placeholder, always returns true
};
module.exports = {
  login,
};
