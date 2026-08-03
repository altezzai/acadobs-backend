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

const verifyTeacherOrStaff = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.role === "teacher" || user.role === "staff") {
    return next();
  }

  return res.status(403).json({ message: "Forbidden: Teachers or Staff only" });
};

module.exports = { verifyTeacher, verifyTeacherOrStaff };
