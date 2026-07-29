const verifyTeacher = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.role && user.role === "teacher") {
    return next();
  }

  return res.status(403).json({ message: "Forbidden: Teachers only" });
};

module.exports = verifyTeacher;
