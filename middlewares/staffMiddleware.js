const StaffPermission = require("../models/staff_permissions");

const verifyStaff = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.role && user.role === "staff") {
    return next();
  }

  return res.status(403).json({ message: "Forbidden: Staff only" });
};

const checkStaffPermission = (permissionField) => async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!user.role || user.role !== "staff") {
    return res.status(403).json({ message: "Forbidden: Staff only" });
  }

  const userId = user.user_id || user.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const permissionFields = Array.isArray(permissionField)
      ? permissionField
      : [permissionField];

    const permissionRecord = await StaffPermission.findOne({
      where: { user_id: userId },
      attributes: permissionFields,
    });

    const hasPermission = permissionFields.some(
      (field) => permissionRecord && permissionRecord[field] === true,
    );

    if (hasPermission) {
      return next();
    }

    return res.status(403).json({
      message: "You do not have permission to access this function",
    });
  } catch (error) {
    console.error("Staff permission check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

verifyStaff.checkStaffPermission = checkStaffPermission;
verifyStaff.verifyStaff = verifyStaff;

module.exports = verifyStaff;
module.exports.checkStaffPermission = checkStaffPermission;
module.exports.verifyStaff = verifyStaff;
