const { Op, where, DATEONLY } = require("sequelize");
const User = require("../models/user");
// const Student = require("../models/student");
const HomeworkAssignment = require("../models/homeworkassignment");
const Homework = require("../models/homework");
const AttendanceMarked = require("../models/attendancemarked");
const Attendance = require("../models/attendance");
const Achievement = require("../models/achievement");
const StudentAchievement = require("../models/studentachievement");
const InternalMark = require("../models/internal_marks");
const Marks = require("../models/marks");
const Subject = require("../models/subject");
const LeaveRequest = require("../models/leaverequest");
const School = require("../models/school");
// const Event = require("../models/event");
// const News = require("../models/news");
const Invoice = require("../models/invoice");
const InvoiceStudent = require("../models/invoice_students");
const Payment = require("../models/payment");
const Student = require("../models/student");
const Guardian = require("../models/guardian");

const { Class } = require("../models");
const { schoolSequelize } = require("../config/connection");
const e = require("express");

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

    let whereClause = {
      trash: false,
      school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { payment_type: { [Op.like]: `%${searchQuery}%` } },
        { transaction_id: { [Op.like]: `%${searchQuery}%` } },

        // Add other fields to search if needed
      ];
    }
    if (student_id) {
      whereClause.student_id = student_id;
    }
    if (payment_status) {
      whereClause.payment_status = payment_status;
    }
    if (payment_type) {
      whereClause.payment_type = payment_type;
    }
    const totalCount = await Payment.count({ where: whereClause });
    const report = await Payment.findAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
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
      totalCount,
      totalPages: download === "true" ? null : Math.ceil(totalCount / limit),
      currentPage: download === "true" ? null : page,
      report,
    });
  } catch (error) {
    console.error("Error generating payment report:", error);
    res.status(500).json({ error: "Failed to generate payment report" });
  }
};
const getAttendanceReport = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const date = req.query.date || "";
    const class_id = req.query.class_id || "";
    const teacher_id = req.query.teacher_id || "";

    const download = req.query.download || "";
    let { page = 1, limit = 10 } = req.query;
    if (download === "true") {
      page = null;
      limit = null;
    } else {
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
    }

    const offset = page && limit ? (page - 1) * limit : 0;

    const whereClause = { trash: false, school_id };
    if (date) whereClause.date = date;
    if (class_id) whereClause.class_id = class_id;
    if (teacher_id) whereClause.teacher_id = teacher_id;
    const totalCount = await Attendance.count({ where: whereClause });
    const attendance = await Attendance.findAll({
      offset,
      limit,
      distinct: true,
      where: whereClause,
      include: [
        {
          model: AttendanceMarked,
          attributes: ["id", "status", "remarks"],
          include: [
            { model: Student, attributes: ["id", "full_name", "image"] },
          ],
        },
        { model: Class, attributes: ["id", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
        { model: User, attributes: ["id", "name"] },
      ],
      order: [["date", "DESC"]],
    });

    // Format summarized report
    const formattedData = attendance.map((record) => {
      const total_students = record.AttendanceMarkeds?.length || 0;
      const present_count =
        record.AttendanceMarkeds?.filter((m) => m.status === "present")
          .length || 0;
      const absent_count =
        record.AttendanceMarkeds?.filter((m) => m.status === "absent").length ||
        0;
      const late_count =
        record.AttendanceMarkeds?.filter((m) => m.status === "late").length ||
        0;
      const leave_count =
        record.AttendanceMarkeds?.filter((m) => m.status === "leave").length ||
        0;

      return {
        id: record.id,
        class: record.Class.classname,
        subject: record.subject_id ? record.Subject.subject_name : "null",
        teacher: record.teacher_id ? record.User.name : "null",
        period: record.period,
        date: record.date,
        total_students,
        present_count,
        absent_count,
        late_count,
        leave_count,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      totalCount,
      totalPages: download === "true" ? null : totalPages,
      currentPage: download === "true" ? null : page,
      reports: formattedData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
const getHomeworkReport = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.query.class_id || "";
    const teacher_id = req.query.teacher_id || "";
    const subject_id = req.query.subject_id || "";

    const download = req.query.download || "";
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
    let whereClause = {
      trash: false,
      school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
        // Add other fields to search if needed
      ];
    }
    if (class_id) {
      whereClause.class_id = class_id;
    }
    if (subject_id) {
      whereClause.subject_id = subject_id;
    }
    if (teacher_id) {
      whereClause.teacher_id = teacher_id;
    }
    const totalCount = await Homework.count({ where: whereClause });
    const homeworks = await Homework.findAll({
      where: whereClause,
      offset,
      limit,
      include: [
        { model: Class, attributes: ["id", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
        { model: User, attributes: ["id", "name"] },
        {
          model: HomeworkAssignment,
          attributes: ["id", "student_id", "points"],
          include: [{ model: Student, attributes: ["id", "full_name"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // ✅ Summarize report
    const formattedReport = homeworks.map((hw) => {
      const assignments = hw.HomeworkAssignments || [];
      const total_students = assignments.length;

      // Count per point level (1 to 5)
      const point_1_count = assignments.filter((a) => a.points === 1).length;
      const point_2_count = assignments.filter((a) => a.points === 2).length;
      const point_3_count = assignments.filter((a) => a.points === 3).length;
      const point_4_count = assignments.filter((a) => a.points === 4).length;
      const point_5_count = assignments.filter((a) => a.points === 5).length;

      return {
        id: hw.id,
        class: hw.class_id ? hw.Class.classname : "null",
        subject: hw.subject_id ? hw.Subject.subject_name : "null",
        teacher: hw.teacher_id ? hw.User.name : "null",
        title: hw.title,
        due_date: hw.due_date,
        total_students,
        point_1_count,
        point_2_count,
        point_3_count,
        point_4_count,
        point_5_count,
      };
    });

    res.status(200).json({
      totalCount,
      totalPages: download === "true" ? null : Math.ceil(totalCount / limit),
      currentPage: download === "true" ? null : page,
      report: formattedReport,
    });
  } catch (error) {
    console.error("Error generating homework report:", error);
    res.status(500).json({ error: "Failed to generate homework report" });
  }
};
const getStudentReportByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const school_id = req.user.school_id;
    const schooldata = await School.findOne({ where: { id: school_id } });
    const education_year_start =
      schooldata.education_year_start || process.env.EDUCATION_YEAR_START;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    // ✅ 1. Fetch student info
    const student = await Student.findOne({
      where: { id: student_id, school_id },
      include: [
        { model: Class, attributes: ["classname"] },
        {
          model: User,
          attributes: ["name"],
          include: [
            {
              model: Guardian,
              attributes: [
                "guardian_name",
                "guardian_contact",
                "guardian_email",
                "guardian_job",
                "guardian_relation",
              ],
            },
          ],
        },
      ],
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // ✅ 2. Fetch payments
    const payments = await Payment.findAll({
      where: {
        student_id,
        // school_id,
        createdAt: { [Op.gte]: education_year_start },
      },
      include: [
        {
          model: InvoiceStudent,
          attributes: ["invoice_id", "status"],
          include: [
            {
              model: Invoice,
              attributes: ["title", "amount", "due_date"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });

    // ✅ 3. Fetch invoices
    const invoices = await InvoiceStudent.findAll({
      where: { student_id, createdAt: { [Op.gte]: education_year_start } },
      include: [
        {
          model: Invoice,
          where: { school_id },
          attributes: ["title", "amount", "due_date"],
        },
      ],
      offset,
      limit,
    });
    //ATTENDANCE, MARKS, ACHIEVEMENTS can be added similarly
    const Attendancedata = await AttendanceMarked.findAll({
      where: { student_id },
    });
    const attendance = await AttendanceMarked.findAll({
      where: { student_id, createdAt: { [Op.gte]: education_year_start } },
      include: [
        {
          model: Attendance,
          attributes: ["date"],
          include: [
            { model: Class, attributes: ["classname"] },
            { model: Subject, attributes: ["subject_name"] },
            { model: User, attributes: ["name"] },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });
    //where get the count of attendance statuses
    const attendanceSummary = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
    };
    Attendancedata.forEach((record) => {
      if (record.status in attendanceSummary) {
        attendanceSummary[record.status] += 1;
      }
    });
    const leaveRequests = await LeaveRequest.findAll({
      where: { student_id, createdAt: { [Op.gte]: education_year_start } },
      attributes: [
        "from_date",
        "to_date",
        "reason",
        "status",
        "admin_remarks",
        "leave_type",
        "leave_duration",
        "half_section",
        "createdAt",
      ],
      include: [{ model: User, attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });

    //achivments
    const achievements = await StudentAchievement.findAll({
      where: { student_id, createdAt: { [Op.gte]: education_year_start } },
      attributes: ["status", "proof_document", "remarks"],
      include: [
        {
          model: Achievement,
          attributes: [
            "title",
            "description",
            "date",
            "level",
            "category",
            "awarding_body",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });
    const homework = await HomeworkAssignment.findAll({
      where: { student_id, createdAt: { [Op.gte]: education_year_start } },
      attributes: ["points", "remarks", "createdAt"],
      include: [
        {
          model: Homework,
          attributes: ["title", "description", "due_date"],
          include: [
            { model: Class, attributes: ["classname"] },
            { model: Subject, attributes: ["subject_name"] },
            { model: User, attributes: ["name"] },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });
    const internalMarks = await Marks.findAll({
      where: { student_id, createdAt: { [Op.gte]: education_year_start } },
      attributes: ["marks_obtained", "status"],
      include: [
        {
          model: InternalMark,
          attributes: ["internal_name", "max_marks", "date"],
          include: [
            { model: Class, attributes: ["classname"] },
            { model: Subject, attributes: ["subject_name"] },
            { model: User, attributes: ["name"] },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });
    res.status(200).json({
      student,
      payments,
      invoices,
      attendanceSummary,
      attendance,
      leaveRequests,
      achievements,
      homework,
      internalMarks,
    });
  } catch (error) {
    console.error("Error generating student report:", error);
    res.status(500).json({ error: "Failed to generate student report" });
  }
};
module.exports = {
  getInvoiceReport,
  getPaymentReport,
  getAttendanceReport,
  getHomeworkReport,
  getStudentReportByStudentId,
};
