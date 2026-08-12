const { Op, where, DATEONLY ,Sequelize} = require("sequelize");

const User = require("../models/user");
const logger = require("../utils/logger");
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
const Invoice = require("../models/invoice");
const InvoiceStudent = require("../models/invoice_students");
const Payment = require("../models/payment");
const Student = require("../models/student");
const Guardian = require("../models/guardian");
const Staff = require("../models/staff");
const Staffsubject = require("../models/staffsubject");
const SpecialClassStudent = require("../models/special_class_students");
const Exam = require("../models/exams");
const Mark= require("../models/marks");
const { Class } = require("../models");
const { schoolSequelize } = require("../config/connection");
const e = require("express");
const PDFDocument = require("pdfkit-table");


const getInvoiceReport = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const download = req.query.download || "";
    const searchQuery = req.query.q || "";
    const category = req.query.category || null;
    const class_id = req.query.class_id || null;
    const due_date = req.query.due_date || null;

    let { page = 1, limit = 10 } = req.query;

    if (download === "true") {
      page = null;
      limit = null;
    } else {
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
    }

    const offset = page && limit ? (page - 1) * limit : 0;

    const countQuery = `
      SELECT COUNT(DISTINCT i.id) AS total
      FROM invoices i
      LEFT JOIN invoice_students istd ON i.id = istd.invoice_id
      LEFT JOIN students s ON s.id = istd.student_id
      WHERE i.school_id = :schoolId
      AND (:classId IS NULL OR s.class_id = :classId)
      AND (:title IS NULL OR i.title LIKE :titleLike)
      AND (:category IS NULL OR i.category = :category)
      AND (:dueDate IS NULL OR DATE(i.due_date) = :dueDate)
    `;

    const totalResult = await schoolSequelize.query(countQuery, {
      replacements: {
        schoolId: school_id,
        classId: class_id || null,
        title: searchQuery || null,
        titleLike: searchQuery ? `%${searchQuery}%` : null,
        category: category || null,
        dueDate: due_date || null,
      },
      type: schoolSequelize.QueryTypes.SELECT,
    });

    const total = totalResult[0]?.total || 0;

    // ✅ Main query with school_id and due_date filter
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

      WHERE i.school_id = :schoolId
      AND (:classId IS NULL OR s.class_id = :classId)
      AND (:title IS NULL OR i.title LIKE :titleLike)
      AND (:category IS NULL OR i.category = :category)
      AND (:dueDate IS NULL OR DATE(i.due_date) = :dueDate)

      GROUP BY i.id, i.title, i.category, i.createdAt, i.due_date
      ORDER BY i.createdAt DESC
    `;

    // ✅ Add pagination if not downloading
    if (!(download === "true") && page && limit) {
      query += ` LIMIT :limit OFFSET :offset`;
    }

    const report = await schoolSequelize.query(query, {
      replacements: {
        schoolId: school_id,
        classId: class_id || null,
        title: searchQuery || null,
        titleLike: searchQuery ? `%${searchQuery}%` : null,
        category: category || null,
        dueDate: due_date || null,
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
    logger.error("Error generating invoice report:", error);
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
      payment_category,
      student_id,
    } = req.query;
    const start_date = req.query.start_date || null;
    const end_date = req.query.end_date || null;
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
    if (student_id) {
      whereClause.student_id = student_id;
    }
    if (payment_status) {
      whereClause.payment_status = payment_status;
    }
    if (payment_category) {
      whereClause.payment_category = payment_category;
    }
    if (start_date) {
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.gte]: new Date(startDate),
      };
    }
    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(endDate),
      };
    }
    let whereStudent = {};
    if (class_id) {
      whereStudent.class_id = class_id;
    }
    if (searchQuery) {
      whereStudent[Op.or] = [
        { full_name: { [Op.like]: `%${searchQuery}%` } },
        { reg_no: { [Op.like]: `%${searchQuery}%` } },
      ];
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
          where: whereStudent,
          include: [
            {
              model: Class,
              attributes: ["id", "classname"],
              where: year ? { year } : {},
            },
          ],
        },
        {
          model: InvoiceStudent,
          attributes: ["id", "status"],
          include: [
            {
              model: Invoice,
              attributes: ["id", "title", "category"],
              required: true,
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
    logger.error("Error generating payment report:", error);
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
    const start_date = req.query.start_date || "";
    const end_date = req.query.end_date || "";

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
    if (start_date) {
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.gte]: new Date(startDate),
      };
    }
    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(endDate),
      };
    }
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
  } catch (error) {
    logger.error("Error generating attendance report:", error);
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const getHomeworkReport = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.query.class_id || "";
    const teacher_id = req.query.teacher_id || "";
    const subject_id = req.query.subject_id || "";
    const searchQuery = req.query.q || "";
    const start_date = req.query.start_date || "";
    const end_date = req.query.end_date || "";

    const download = req.query.download || "";
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
    if (start_date) {
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.gte]: new Date(startDate),
      };
    }
    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(endDate),
      };
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
    logger.error("Error generating homework report:", error);
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
      include: [
        {
          model: Attendance,
          attributes: ["date"],
          where: { date: { [Op.gte]: education_year_start }, trash: false ,school_id},
        }, 
      ],
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
    logger.error("Error generating student report:", error);
    console.error("Error generating student report:", error);
    res.status(500).json({ error: "Failed to generate student report" });
  }
};
const getInternalmarksReport = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.query.class_id || null;
    const subject_id = req.query.subject_id || null;
    const teacher_id = req.query.teacher_id || null;
    const start_date = req.query.start_date || null;
    const end_date = req.query.end_date || null;
    const exam_id = req.query.exam_id || null;
    const searchQuery = req.query.q || "";
    const passMarkPercentage = 0.4; // 40% pass mark

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

    let whereClause = {
      school_id,
      trash: false,
    };
    if (class_id) {
      whereClause.class_id = class_id;
    }
    if (subject_id) {
      whereClause.subject_id = subject_id;
    }
    if (teacher_id) {
      whereClause.recorded_by = teacher_id;
    }
    if (exam_id) {
      whereClause.exam_id = exam_id;
    }
    if (searchQuery) {
      whereClause[Op.or] = [
        { internal_name: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (start_date) {
      const startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0);
      whereClause.date = {
        ...whereClause.date,
        [Op.gte]: new Date(startDate),
      };
    }
    if (end_date) {
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.date = {
        ...whereClause.date,
        [Op.lte]: new Date(endDate),
      };
    }
    const count = await InternalMark.count({ where: whereClause });
    const internalMarks = await InternalMark.findAll({
      where: whereClause,
      offset,
      limit,
      distinct: true,
      attributes: ["id", "internal_name", "max_marks", "date", "createdAt"],
      include: [
        { model: Marks, attributes: ["marks_obtained"] },

        { model: Class, attributes: ["classname"] },
        { model: Subject, attributes: ["subject_name"] },
        { model: User, attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    const enrichedData = internalMarks.map((internal) => {
      const totalStudents = internal.Marks?.length || 0;
      const passMark = (internal.max_marks || 0) * passMarkPercentage; // 40% rule
      let passCount = 0;

      internal.Marks?.forEach((m) => {
        if (m.marks_obtained >= passMark) passCount++;
      });

      const failCount = totalStudents - passCount;
      const passPercentage =
        totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(1) : 0;

      return {
        id: internal.id,
        internal_name: internal.internal_name,
        class: internal.Class?.classname || null,
        subject: internal.Subject?.subject_name || null,
        teacher: internal.User?.name || null,
        date: internal.date,
        max_marks: internal.max_marks,
        total_students: totalStudents,
        pass_students: passCount,
        fail_students: failCount,
        pass_percentage: passPercentage,
      };
    });

    // ✅ Final response
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalContents: count,
      totalPages: download === "true" ? null : totalPages,
      currentPage: download === "true" ? null : page,
      internalMarksReport: enrichedData,
    });
  } catch (error) {
    logger.error("Error fetching internal marks:", error);
    console.error("Error fetching internal marks:", error);
    res.status(500).json({ error: "Failed to fetch internal marks" });
  }
};
const getClassWaiseTermMarksPdf = async (req, res) => {
  let doc = null;

  try {
    const user_id = req.user.user_id;
    const school_id = req.user.school_id;

    const exam_id = req.query.exam_id;
    const internal_name = req.query.internal_name;
    const class_id = req.query.class_id || "";

    if (!exam_id && !internal_name) {
      return res.status(400).json({
        error: "Please provide either exam_id or internal_name",
      });
    }

    const classRecord = await Staff.findOne({
      where: {
        user_id,
        school_id,
        trash: false,
      },
      attributes: ["class_id"],
    });

    const classId = class_id
      ? Number(class_id)
      : Number(classRecord?.class_id || 0);

    if (!classId) {
      return res.status(403).json({
        error: "You are not assigned to a class",
      });
    }

    if (isNaN(classId)) {
      return res.status(400).json({
        error: "Invalid class_id",
      });
    }

    const classData = await Class.findOne({
      where: {
        id: classId,
        school_id,
        trash: false,
      },
    });

    if (!classData) {
      return res.status(404).json({
        error: "Class not found",
      });
    }

    const className = classData.classname;

    const students = await Student.findAll({
      where: {
        class_id: classId,
        trash: false,
      },
      attributes: [
        "id",
        "full_name",
        "roll_number",
      ],
      order: [
        ["roll_number", "ASC"],
      ],
    });

    if (!students.length) {
      return res.status(404).json({
        error: "No students found in this class",
      });
    }

    const studentClassSubQuery = Sequelize.literal(`(
      SELECT DISTINCT m.internal_id
      FROM marks m
      INNER JOIN students s
        ON s.id = m.student_id
      WHERE s.class_id = ${classId}
    )`);

    const internalWhere = {
      [Op.and]: [
        {
          trash: false,
          school_id,
        },
        {
          [Op.or]: [
            {
              class_id: classId,
            },
            {
              id: {
                [Op.in]: studentClassSubQuery,
              },
            },
          ],
        },
      ],
    };

    if (exam_id) {
      internalWhere[Op.and].push({
        exam_id,
      });
    }

    if (internal_name) {
      internalWhere[Op.and].push({
        internal_name: {
          [Op.like]: `%${internal_name}%`,
        },
      });
    }

    const internals = await InternalMark.findAll({
      where: internalWhere,

      include: [
        {
          model: Subject,
          attributes: [
            "id",
            "subject_name",
            "is_multi_teacher",
            "priority",
          ],
        },

        {
          model: Exam,
          attributes: [
            "id",
            "exam_name",
            "education_year",
          ],
        },

        {
          model: Mark,
          attributes: [
            "id",
            "student_id",
            "marks_obtained",
            "status",
          ],
          include: [
            {
              model: Student,
              where: {
                class_id: classId,
                trash: false,
              },
              attributes: [
                "id",
                "full_name",
                "roll_number",
              ],
            },
          ],
        },
      ],

      order: [
        [
          { model: Subject },
          "priority",
          "ASC",
        ],
        ["date", "ASC"],
      ],

      distinct: true,
    });

    if (!internals.length) {
      return res.status(404).json({
        error: "No marks found for the selected criteria",
      });
    }

    const subjects = [];
    const subjectMap = {};

    internals.forEach((internal) => {
      const subject = internal.Subject;

      if (!subject?.id) {
        return;
      }

      if (!subjectMap[subject.id]) {
        subjectMap[subject.id] = {
          id: subject.id,
          name: subject.subject_name,
          max_marks: internal.max_marks,
          priority: subject.priority ?? 999999,
        };

        subjects.push(subjectMap[subject.id]);
      }
    });

    subjects.sort((a, b) => {
      const priorityA = Number(a.priority ?? 999999);
      const priorityB = Number(b.priority ?? 999999);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return String(a.name).localeCompare(
        String(b.name)
      );
    });

    const marksLookup = {};

    internals.forEach((internal) => {
      const subjectId = internal.Subject?.id;

      if (!subjectId) {
        return;
      }

      if (!marksLookup[subjectId]) {
        marksLookup[subjectId] = {};
      }

      (internal.Marks || []).forEach((mark) => {
        const studentId = mark.student_id;

        if (!marksLookup[subjectId][studentId]) {
          marksLookup[subjectId][studentId] = {
            marks_obtained: mark.marks_obtained,
            status: mark.status,
          };
        }
      });
    });

    const firstExam = internals.find(
      (item) => item.Exam
    )?.Exam;

    let examName = firstExam?.exam_name || "-";
    let educationYear =
      firstExam?.education_year || "-";

    if (exam_id) {
      const exam = await Exam.findOne({
        where: {
          id: exam_id,
          school_id,
          trash: false,
        },
        attributes: [
          "id",
          "exam_name",
          "education_year",
        ],
      });

      if (exam) {
        examName = exam.exam_name || "-";
        educationYear =
          exam.education_year || "-";
      }
    }

    doc = new PDFDocument({
      size: "A4",
      layout: "landscape",

      margins: {
        top: 40,
        bottom: 40,
        left: 30,
        right: 30,
      },

      bufferPages: true,
    });

    const safeClassName = String(
      className || classId
    ).replace(
      /[^a-zA-Z0-9-_]/g,
      "_"
    );

    const fileName =
      `class-${safeClassName}-marks-report.pdf`;

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileName}"`
    );

    doc.pipe(res);

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(
        "STUDENT MARKS REPORT",
        {
          align: "center",
          lineBreak: true,
        }
      );

    doc
      .font("Helvetica")
      .fontSize(9);

    doc.text(
      `Class: ${className}`,
      30,
      75,
      {
        lineBreak: false,
      }
    );

    doc.text(
      `Exam: ${examName}`,
      230,
      75,
      {
        lineBreak: false,
      }
    );

    doc.text(
      `Internal: ${internal_name || "-"}`,
      430,
      75,
      {
        lineBreak: false,
      }
    );

    doc.text(
      `Academic Year: ${educationYear}`,
      650,
      75,
      {
        lineBreak: false,
      }
    );

    const pageWidth = 842;
    const leftMargin = 30;
    const rightMargin = 30;

    const usableWidth =
      pageWidth -
      leftMargin -
      rightMargin;

    const subjectCount = subjects.length;

    const rollWidth = 48;

    let studentNameWidth;

    if (subjectCount <= 6) {
      studentNameWidth = 145;
    } else if (subjectCount <= 8) {
      studentNameWidth = 135;
    } else if (subjectCount <= 10) {
      studentNameWidth = 125;
    } else if (subjectCount <= 12) {
      studentNameWidth = 115;
    } else {
      studentNameWidth = 105;
    }

    const totalWidth = 55;

    const remainingWidth =
      usableWidth -
      rollWidth -
      studentNameWidth -
      totalWidth;

    let subjectWidth =
      remainingWidth / subjectCount;

    const minimumSubjectWidth = 38;
    const maximumSubjectWidth = 75;

    subjectWidth = Math.max(
      minimumSubjectWidth,
      Math.min(
        maximumSubjectWidth,
        subjectWidth
      )
    );

    const actualTableWidth =
      rollWidth +
      studentNameWidth +
      totalWidth +
      subjectWidth * subjectCount;

    const tableHeaders = [
      {
        label: "Roll No",
        property: "roll_number",
        width: rollWidth,
      },
      {
        label: "Student Name",
        property: "student_name",
        width: studentNameWidth,
      },
    ];

    subjects.forEach((subject) => {
      tableHeaders.push({
        label: `${subject.name}\n(${subject.max_marks ?? "-"})`,
        property: `subject_${subject.id}`,
        width: subjectWidth,
      });
    });

    tableHeaders.push({
      label: "Total",
      property: "total",
      width: totalWidth,
    });

    const tableRows = students.map((student) => {
      const row = [];

      row.push(
        student.roll_number ?? "-"
      );

      row.push(
        student.full_name ?? "-"
      );

      let total = 0;

      subjects.forEach((subject) => {
        const mark =
          marksLookup[
            subject.id
          ]?.[student.id];

        let displayMark = "-";

        if (mark) {
          const status = mark.status
            ? String(
                mark.status
              ).toLowerCase()
            : "";

          if (
            status &&
            status !== "present"
          ) {
            displayMark =
              mark.status;
          } else if (
            mark.marks_obtained !== null &&
            mark.marks_obtained !== undefined
          ) {
            displayMark =
              mark.marks_obtained;

            const numericMark =
              Number(
                mark.marks_obtained
              );

            if (
              !isNaN(numericMark)
            ) {
              total += numericMark;
            }
          }
        }

        row.push(displayMark);
      });

      row.push(total);

      return row;
    });

    await doc.table(
      {
        headers: tableHeaders,
        rows: tableRows,
      },
      {
        x: leftMargin,
        y: 110,

        width: actualTableWidth,

        padding: subjectCount >= 10
          ? 3
          : 5,

        columnSpacing: 1,

        prepareHeader: () => {
          doc
            .font("Helvetica-Bold")
            .fontSize(
              subjectCount >= 12
                ? 6
                : subjectCount >= 10
                ? 7
                : 8
            );
        },

        prepareRow: () => {
          doc
            .font("Helvetica")
            .fontSize(
              subjectCount >= 12
                ? 6
                : subjectCount >= 10
                ? 7
                : 8
            );
        },
      }
    );

    const range =
      doc.bufferedPageRange();

    for (
      let i = range.start;
      i <
        range.start +
          range.count;
      i++
    ) {
      doc.switchToPage(i);

      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Page ${i + 1} of ${range.count}`,
          30,
          540,
          {
            width: 780,
            align: "center",
            lineBreak: false,
          }
        );
    }

    doc.end();

  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error generating class marks PDF:",
      error
    );

    console.error(
      "Error generating class marks PDF:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        error: error.message,
      });
    }

    if (doc) {
      try {
        doc.destroy(error);
      } catch (destroyError) {
        console.error(
          "Error destroying PDF:",
          destroyError
        );
      }
    }
  }
};
const getprograsReportByStudentId = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const student_id = req.params.student_id;

    if (!student_id) {
      return res.status(400).json({
        error: "Please provide student_id",
      });
    }

    const studentId = Number(student_id);

    if (isNaN(studentId)) {
      return res.status(400).json({
        error: "Invalid student_id",
      });
    }

    const today = new Date();

    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const academicStartYear =
      month >= 6 ? year : year - 1;

    const educationYear =
      `${academicStartYear}-${String(
        academicStartYear + 1
      ).slice(-2)}`;

    const student = await Student.findOne({
      where: {
        id: studentId,
        school_id,
        trash: false,
      },
      attributes: [
        "id",
        "full_name",
        "roll_number",
        "class_id",
      ],
    });

    if (!student) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    const classData = await Class.findOne({
      where: {
        id: student.class_id,
        school_id,
        trash: false,
      },
      attributes: [
        "id",
        "classname",
      ],
    });

    if (!classData) {
      return res.status(404).json({
        error: "Student class not found",
      });
    }

    const exams = await Exam.findAll({
      where: {
        school_id,
        education_year: educationYear,
        trash: false,
      },
      attributes: [
        "id",
        "exam_name",
        "education_year",
      ],
      order: [
        ["id", "ASC"],
      ],
    });

    if (!exams.length) {
      return res.status(404).json({
        error: `No exams found for education year ${educationYear}`,
      });
    }

    const examIds = exams.map(
      (exam) => exam.id
    );

    const internals = await InternalMark.findAll({
      where: {
        school_id,
        trash: false,
        exam_id: {
          [Op.in]: examIds,
        },
        [Op.or]: [
          {
            class_id: student.class_id,
          },
          {
            id: {
              [Op.in]: Sequelize.literal(`(
                SELECT DISTINCT m.internal_id
                FROM marks m
                WHERE m.student_id = ${studentId}
              )`),
            },
          },
        ],
      },

      include: [
        {
          model: Subject,
          attributes: [
            "id",
            "subject_name",
            "priority",
            "is_multi_teacher",
          ],
        },

        {
          model: Exam,
          attributes: [
            "id",
            "exam_name",
            "education_year",
          ],
        },

        {
          model: Mark,
          required: false,
          where: {
            student_id: studentId,
          },
          attributes: [
            "id",
            "student_id",
            "marks_obtained",
            "status",
          ],
        },
      ],

      order: [
        [
          { model: Subject },
          "priority",
          "ASC",
        ],
        [
          { model: Subject },
          "subject_name",
          "ASC",
        ],
        ["date", "ASC"],
      ],

      distinct: true,
    });

    if (!internals.length) {
      return res.status(404).json({
        error:
          "No data found for this student",
      });
    }

    const examMap = {};

    exams.forEach((exam) => {
      examMap[exam.id] = {
        exam_id: exam.id,
        exam_name: exam.exam_name,
        education_year: exam.education_year,
        internals: [],
      };
    });

    internals.forEach((internal) => {
      const examId = internal.exam_id;

      if (!examMap[examId]) {
        return;
      }

      const internalName = String(
        internal.internal_name || ""
      ).trim();

      if (!internalName) {
        return;
      }

      const normalizedInternalName =
        internalName.toLowerCase();

      const exists =
        examMap[examId].internals.some(
          (item) =>
            item.internal_name
              .trim()
              .toLowerCase() ===
            normalizedInternalName
        );

      if (!exists) {
        examMap[examId].internals.push({
          internal_id: internal.id,
          internal_name: internalName,
          max_marks: internal.max_marks,
          date: internal.date,
        });
      }
    });

    const reportExams =
      Object.values(examMap).filter(
        (exam) =>
          exam.internals.length > 0
      );

    const subjectsMap = {};

    internals.forEach((internal) => {
      const subject = internal.Subject;

      if (!subject?.id) {
        return;
      }

      const internalName = String(
        internal.internal_name || ""
      ).trim();

      if (!internalName) {
        return;
      }

      if (!subjectsMap[subject.id]) {
        subjectsMap[subject.id] = {
          subject_id: subject.id,
          subject_name:
            subject.subject_name,
          priority:
            subject.priority ?? 999999,
          marks: {},
        };
      }

      const markKey =
        `${internal.exam_id}_${internalName
          .toLowerCase()}`;

      const studentMark =
        internal.Marks?.[0];

      if (
        !subjectsMap[subject.id].marks[
          markKey
        ]
      ) {
        subjectsMap[subject.id].marks[
          markKey
        ] = {
          internal_id: internal.id,
          exam_id: internal.exam_id,
          internal_name: internalName,
          max_marks: internal.max_marks,
          marks_obtained:
            studentMark?.marks_obtained ??
            null,
          status:
            studentMark?.status ?? null,
        };
      } else {
        const existingMark =
          subjectsMap[subject.id].marks[
            markKey
          ];

        if (
          existingMark.marks_obtained === null &&
          studentMark?.marks_obtained !==
            null &&
          studentMark?.marks_obtained !==
            undefined
        ) {
          existingMark.marks_obtained =
            studentMark.marks_obtained;

          existingMark.status =
            studentMark.status ?? null;
        }
      }
    });

    const subjects =
      Object.values(subjectsMap);

    subjects.sort((a, b) => {
      const priorityA =
        Number(a.priority ?? 999999);

      const priorityB =
        Number(b.priority ?? 999999);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return String(
        a.subject_name
      ).localeCompare(
        String(b.subject_name)
      );
    });

    const columns = [];
    const usedColumns = new Set();

    reportExams.forEach((exam) => {
      exam.internals.forEach(
        (internal) => {
          const normalizedInternalName =
            String(
              internal.internal_name || ""
            )
              .trim()
              .toLowerCase();

          const uniqueKey =
            `${exam.exam_id}_${normalizedInternalName}`;

          if (
            usedColumns.has(uniqueKey)
          ) {
            return;
          }

          usedColumns.add(uniqueKey);

          const safeInternalName =
            normalizedInternalName
              .replace(/[^a-zA-Z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "");

          columns.push({
            key:
              `exam_${exam.exam_id}_internal_${safeInternalName}`,

            exam_id:
              exam.exam_id,

            exam_name:
              exam.exam_name,

            internal_id:
              internal.internal_id,

            internal_name:
              internal.internal_name,

            max_marks:
              internal.max_marks,
          });
        }
      );
    });

    const tableRows =
      subjects.map((subject) => {
        const row = {
          subject_id:
            subject.subject_id,

          subject_name:
            subject.subject_name,

          priority:
            subject.priority,
        };

        columns.forEach((column) => {
          const markKey =
            `${column.exam_id}_${String(
              column.internal_name
            )
              .trim()
              .toLowerCase()}`;

          const mark =
            subject.marks[markKey];

          row[column.key] = {
            marks_obtained:
              mark?.marks_obtained ??
              null,

            status:
              mark?.status ?? null,

            max_marks:
              column.max_marks ??
              mark?.max_marks ??
              null,
          };
        });

        return row;
      });

    return res.status(200).json({
      education_year: educationYear,

      student: {
        id: student.id,
        full_name: student.full_name,
        roll_number: student.roll_number,
        class_id: student.class_id,
        class_name:
          classData.classname,
      },

      exams: reportExams,

      columns,

      subjects: tableRows,
    });

  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error generating student progress report:",
      error
    );

    console.error(
      "Error generating student progress report:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};
module.exports = {
  getInvoiceReport,
  getPaymentReport,
  getAttendanceReport,
  getHomeworkReport,
  getStudentReportByStudentId,
  getInternalmarksReport, 
  getClassWaiseTermMarksPdf,
  getprograsReportByStudentId,
};
