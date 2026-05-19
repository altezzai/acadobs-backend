const { Op } = require("sequelize");
const logger = require("../utils/logger");
const StudentTransfer = require("../models/student_transfer");
const Student = require("../models/student");
const School = require("../models/school");
const User = require("../models/user");
const Guardian = require("../models/guardian");
const { schoolSequelize } = require("../config/connection");

// ─────────────────────────────────────────────
// GUARDIAN — create a transfer request
// ─────────────────────────────────────────────
const guardianCreateTransferRequest = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { student_id, to_school_id, reason } = req.body;

    if (!student_id || !to_school_id) {
      return res
        .status(400)
        .json({ error: "student_id and to_school_id are required" });
    }

    // Verify the student belongs to this guardian
    const student = await Student.findOne({
      where: { id: student_id, guardian_id: user_id, trash: false },
    });
    if (!student) {
      return res
        .status(404)
        .json({ error: "Student not found or not under your guardianship" });
    }

    const from_school_id = student.school_id;

    if (from_school_id === parseInt(to_school_id)) {
      return res
        .status(400)
        .json({ error: "from_school and to_school cannot be the same" });
    }

    // Verify destination school exists
    const toSchool = await School.findOne({
      where: { id: to_school_id, trash: false },
    });
    if (!toSchool) {
      return res.status(404).json({ error: "Destination school not found" });
    }

    // Prevent duplicate pending request
    const existing = await StudentTransfer.findOne({
      where: {
        student_id,
        to_school_id,
        status: "pending",
        trash: false,
      },
    });
    if (existing) {
      return res.status(409).json({
        error: "A pending transfer request already exists for this student to the same school",
      });
    }

    const transfer = await StudentTransfer.create({
      student_id,
      from_school_id,
      to_school_id,
      user_id,
      requested_by_role: "guardian",
      reason: reason || null,
      status: "pending",
    });

    res.status(201).json({ message: "Transfer request submitted", transfer });
  } catch (error) {
    logger.error("guardianCreateTransferRequest error:", error);
    res.status(500).json({ error: "Failed to create transfer request" });
  }
};

// Guardian — list their own transfer requests
const guardianGetTransferRequests = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    const whereClause = { user_id, trash: false, requested_by_role: "guardian" };
    if (status) whereClause.status = status;

    const { count, rows: transfers } = await StudentTransfer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image"],
        },
        {
          model: School,
          as: "FromSchool",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: School,
          as: "ToSchool",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      transfers,
    });
  } catch (error) {
    logger.error("guardianGetTransferRequests error:", error);
    res.status(500).json({ error: "Failed to fetch transfer requests" });
  }
};

// ─────────────────────────────────────────────
// SCHOOL ADMIN — create a transfer request
// ─────────────────────────────────────────────
const adminCreateTransferRequest = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const from_school_id = req.user.school_id;
    const { student_id, to_school_id, reason } = req.body;

    if (!student_id || !to_school_id) {
      return res
        .status(400)
        .json({ error: "student_id and to_school_id are required" });
    }

    // Verify student belongs to this admin's school
    const student = await Student.findOne({
      where: { id: student_id, school_id: from_school_id, trash: false },
    });
    if (!student) {
      return res
        .status(404)
        .json({ error: "Student not found in your school" });
    }

    if (from_school_id === parseInt(to_school_id)) {
      return res
        .status(400)
        .json({ error: "from_school and to_school cannot be the same" });
    }

    // Verify destination school exists
    const toSchool = await School.findOne({
      where: { id: to_school_id, trash: false },
    });
    if (!toSchool) {
      return res.status(404).json({ error: "Destination school not found" });
    }

    // Prevent duplicate pending request
    const existing = await StudentTransfer.findOne({
      where: {
        student_id,
        to_school_id,
        status: "pending",
        trash: false,
      },
    });
    if (existing) {
      return res.status(409).json({
        error: "A pending transfer request already exists for this student to the same school",
      });
    }

    const transfer = await StudentTransfer.create({
      student_id,
      from_school_id,
      to_school_id,
      user_id,
      requested_by_role: "admin",
      reason: reason || null,
      status: "pending",
    });

    res.status(201).json({ message: "Transfer request submitted", transfer });
  } catch (error) {
    logger.error("adminCreateTransferRequest error:", error);
    res.status(500).json({ error: "Failed to create transfer request" });
  }
};

// School Admin — list outgoing requests (sent by this school)
const adminGetOutgoingTransferRequests = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;
    const searchQuery = req.query.q || "";

    const whereClause = { from_school_id: school_id, trash: false };
    if (status) whereClause.status = status;

    const studentWhere = {};
    if (searchQuery) {
      studentWhere[Op.or] = [
        { full_name: { [Op.like]: `%${searchQuery}%` } },
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { count, rows: transfers } = await StudentTransfer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image"],
          where: Object.keys(studentWhere).length ? studentWhere : undefined,
          required: Object.keys(studentWhere).length > 0,
        },
        {
          model: School,
          as: "ToSchool",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: User,
          as: "Requester",
          attributes: ["id", "name", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      transfers,
    });
  } catch (error) {
    logger.error("adminGetOutgoingTransferRequests error:", error);
    res.status(500).json({ error: "Failed to fetch outgoing transfer requests" });
  }
};

// School Admin — list incoming requests (requests to transfer INTO this school)
const adminGetIncomingTransferRequests = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;
    const searchQuery = req.query.q || "";

    const whereClause = { to_school_id: school_id, trash: false };
    if (status) whereClause.status = status;

    const studentWhere = {};
    if (searchQuery) {
      studentWhere[Op.or] = [
        { full_name: { [Op.like]: `%${searchQuery}%` } },
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { count, rows: transfers } = await StudentTransfer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image"],
          where: Object.keys(studentWhere).length ? studentWhere : undefined,
          required: Object.keys(studentWhere).length > 0,
        },
        {
          model: School,
          as: "FromSchool",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: User,
          as: "Requester",
          attributes: ["id", "name", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    res.status(200).json({
      totalcontent: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      transfers,
    });
  } catch (error) {
    logger.error("adminGetIncomingTransferRequests error:", error);
    res.status(500).json({ error: "Failed to fetch incoming transfer requests" });
  }
};

// School Admin — get a single transfer request by id
const adminGetTransferRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;

    const transfer = await StudentTransfer.findOne({
      where: {
        id,
        trash: false,
        [Op.or]: [{ from_school_id: school_id }, { to_school_id: school_id }],
      },
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image", "school_id"],
        },
        {
          model: School,
          as: "FromSchool",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: School,
          as: "ToSchool",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: User,
          as: "Requester",
          attributes: ["id", "name", "role"],
        },
      ],
    });

    if (!transfer) {
      return res.status(404).json({ error: "Transfer request not found" });
    }

    res.status(200).json(transfer);
  } catch (error) {
    logger.error("adminGetTransferRequestById error:", error);
    res.status(500).json({ error: "Failed to fetch transfer request" });
  }
};

// School Admin — accept or reject an incoming transfer request
const adminReviewTransferRequest = async (req, res) => {
  const t = await schoolSequelize.transaction();
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const reviewed_by = req.user.user_id;
    const { status, admin_remarks } = req.body;
    const classId =req.body.class_id || null;


    if (!status || !["accepted", "rejected"].includes(status)) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "status must be 'accepted' or 'rejected'" });
    }

    // Only the destination school admin can review
    const transfer = await StudentTransfer.findOne({
      where: { id, to_school_id: school_id, status: "pending", trash: false },
      transaction: t,
    });

    if (!transfer) {
      await t.rollback();
      return res
        .status(404)
        .json({ error: "Pending transfer request not found for your school" });
    }

    transfer.status = status;
    transfer.reviewed_by = reviewed_by;
    transfer.admin_remarks = admin_remarks || null;
    await transfer.save({ transaction: t });

    if (status === "accepted") {
      await Student.update(
        { school_id: transfer.to_school_id, class_id:classId  },
        { where: { id: transfer.student_id }, transaction: t }
      );
    }

    await t.commit();
    res.status(200).json({
      message: `Transfer request ${status} successfully`,
    });
  } catch (error) {
    await t.rollback();
    logger.error("adminReviewTransferRequest error:", error);
    res.status(500).json({ error: "Failed to review transfer request" });
  }
};

const adminDeleteTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id;
    const userId=req.user.user_id;

    const transfer = await StudentTransfer.findOne({
      where: {
        id,
        trash: false,
        [Op.or]: [{ from_school_id: school_id }, { to_school_id: school_id }],
        user_id:userId
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: "Transfer request not found" });
    }

    await transfer.update({ trash: true });
    res.status(200).json({ message: "Transfer request deleted" });
  } catch (error) {
    logger.error("adminDeleteTransferRequest error:", error);
    res.status(500).json({ error: "Failed to delete transfer request" });
  }
};

module.exports = {
  guardianCreateTransferRequest,
  guardianGetTransferRequests,
  adminCreateTransferRequest,
  adminGetOutgoingTransferRequests,
  adminGetIncomingTransferRequests,
  adminGetTransferRequestById,
  adminReviewTransferRequest,
  adminDeleteTransferRequest,
};
