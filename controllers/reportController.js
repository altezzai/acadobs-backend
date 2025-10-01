const { Op, where, DATEONLY } = require("sequelize");
// const User = require("../models/user");
// const Student = require("../models/student");
// const HomeworkAssignment = require("../models/homeworkassignment");
// const Homework = require("../models/homework");
// const AttendanceMarked = require("../models/attendancemarked");
// const Attendance = require("../models/attendance");
// const Achievement = require("../models/achievement");
// const StudentAchievement = require("../models/studentachievement");
// const InternalMark = require("../models/internal_marks");
// const Subject = require("../models/subject");
// const Marks = require("../models/marks");
// const LeaveRequest = require("../models/leaverequest");
// const School = require("../models/school");
// const Event = require("../models/event");
// const News = require("../models/news");
const Invoice = require("../models/invoice");
const InvoiceStudent = require("../models/invoice_students");
const Payment = require("../models/payment");
const Student = require("../models/student");

const { Class } = require("../models");
const { schoolSequelize } = require("../config/connection");

const getInvoiceReport = async (req, res) => {
  try {
    const { class_id, download, category } = req.query;
    const searchQuery = req.query.q || "";
    let { page = 1, limit = 10 } = req.query;

    // Download mode → no pagination
    if (download === "true") {
      page = null;
      limit = null;
    } else {
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
    }

    const offset = page && limit ? (page - 1) * limit : 0;

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT i.id) AS total
      FROM invoices i
      LEFT JOIN invoice_students istd ON i.id = istd.invoice_id
      LEFT JOIN students s ON s.id = istd.student_id
      WHERE (:classId IS NULL OR s.class_id = :classId)
      AND (:title IS NULL OR i.title LIKE :titleLike)
      AND (:category IS NULL OR i.category = :category)
    `;

    const totalResult = await schoolSequelize.query(countQuery, {
      replacements: {
        classId: class_id || null,
        title: searchQuery || null,
        titleLike: searchQuery ? `%${searchQuery}%` : null,
        category: category || null,
      },
      type: schoolSequelize.QueryTypes.SELECT,
    });

    const total = totalResult[0]?.total || 0;

    // Main report query
    let query = `
      SELECT 
          i.id AS invoice_id,
          i.title,
          i.category,
          i.createdAt AS created_at,
          i.due_date,

          COUNT(DISTINCT istd.student_id) AS total_assigned_students,
          SUM(CASE WHEN istd.status = 'paid' THEN 1 ELSE 0 END) AS paid_students,
          SUM(CASE WHEN istd.status = 'partially_paid' THEN 1 ELSE 0 END) AS partial_paid_students,
          SUM(CASE WHEN istd.status IN ('pending','overdue') THEN 1 ELSE 0 END) AS pending_students,

          (i.amount * COUNT(DISTINCT istd.student_id)) AS total_amount,
          COALESCE(SUM(p.amount), 0) AS collected_amount,
          (i.amount * COUNT(DISTINCT istd.student_id)) - COALESCE(SUM(p.amount), 0) AS pending_amount

      FROM invoices i
      LEFT JOIN invoice_students istd ON i.id = istd.invoice_id
      LEFT JOIN students s ON s.id = istd.student_id
      LEFT JOIN payments p 
            ON p.invoice_student_id = istd.id
            AND istd.status IN ('paid','partially_paid')

      WHERE (:classId IS NULL OR s.class_id = :classId)
      AND (:title IS NULL OR i.title LIKE :titleLike)
      AND (:category IS NULL OR i.category = :category)

      GROUP BY i.id, i.title, i.category, i.createdAt, i.due_date
      ORDER BY i.createdAt DESC
    `;

    // Pagination if not download
    if (!(download === "true") && page && limit) {
      query += ` LIMIT :limit OFFSET :offset`;
    }

    const report = await schoolSequelize.query(query, {
      replacements: {
        classId: class_id || null,
        title: searchQuery || null,
        titleLike: searchQuery ? `%${searchQuery}%` : null,
        category: category || null,
        limit,
        offset,
      },
      type: schoolSequelize.QueryTypes.SELECT,
    });

    res.status(200).json({
      total,
      page: download === "true" ? null : page,
      limit: download === "true" ? null : limit,
      pages: download === "true" ? null : Math.ceil(total / limit),
      report,
    });
  } catch (error) {
    console.error("Error generating invoice report:", error);
    res.status(500).json({ error: "Failed to generate invoice report" });
  }
};
const getPaymentReport = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const {
      class_id,
      year,
      download,
      payment_status,
      payment_type,
      student_id,
    } = req.query;
    const searchQuery = req.query.q || "";
    let { page = 1, limit = 10 } = req.query;

    // Download mode → no pagination
    if (download === "true") {
      page = null;
      limit = null;
    } else {
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
    }

    const offset = page && limit ? (page - 1) * limit : 0;

    let whereConditions = {
      trash: false,
      school_id,
    };
    if (searchQuery) {
      whereConditions[Op.or] = [
        { payment_type: { [Op.like]: `%${searchQuery}%` } },
        { transaction_id: { [Op.like]: `%${searchQuery}%` } },

        // Add other fields to search if needed
      ];
    }
    if (student_id) {
      whereConditions.student_id = student_id;
    }
    if (payment_status) {
      whereConditions.payment_status = payment_status;
    }
    if (payment_type) {
      whereConditions.payment_type = payment_type;
    }
    const { count, rows: report } = await Payment.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereConditions,
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "roll_number", "class_id"],
          where: class_id ? { class_id } : {},
          include: [
            {
              model: Class,
              attributes: ["id", "classname"],
              where: year ? { year } : {},
            },
          ],
        },
      ],
    });
    res.status(200).json({
      total: count,
      page: download === "true" ? null : page,
      limit: download === "true" ? null : limit,
      pages: download === "true" ? null : Math.ceil(count / limit),
      report,
    });
  } catch (error) {
    console.error("Error generating payment report:", error);
    res.status(500).json({ error: "Failed to generate payment report" });
  }
};

module.exports = { getInvoiceReport, getPaymentReport };
