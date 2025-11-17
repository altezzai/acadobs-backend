const verifyStaff = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if ((user.role && user.role === "staff") || user.role === "teacher") {
    return next();
  }

  return res.status(403).json({ message: "Forbidden: Staff or Teacher only" });
};

module.exports = verifyStaff;
