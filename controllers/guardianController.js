const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { Op, where } = require("sequelize");
const logger = require("../utils/logger");
const { deleteFile } = require("../middlewares/storageUploads");
const { normalizeGuardianRelation } = require("../utils/supportingFunction");
const { Class, StudentRoutes, stop, Mark, InternalMark } = require("../models");
const Exams = require("../models/exams");
const HomeworkAssignment = require("../models/homeworkassignment");
const Student = require("../models/student");
const School = require("../models/school");
const User = require("../models/user");
const Payment = require("../models/payment");
const LeaveRequest = require("../models/leaverequest");
const Notice = require("../models/notice");
const NoticeClass = require("../models/noticeclass");
const Staff = require("../models/staff");
const Staffsubject = require("../models/staffsubject");
const Subject = require("../models/subject");
const Timetable = require("../models/timetables");
const Invoice = require("../models/invoice");
const InvoiceStudent = require("../models/invoice_students");
const TimetableSubstitution = require("../models/timetable_substitutions");
const Chat = require("../models/chat");
const Message = require("../models/messages");
const Guardian = require("../models/guardian");
const Homework = require("../models/homework");
const Achievement = require("../models/achievement");
const StudentAchievement = require("../models/studentachievement");
const ParentNote = require("../models/parent_note");
const ParentNoteStudent = require("../models/parent_note_student");
const { schoolSequelize } = require("../config/connection");
const { getschoolIdByStudentId } = require("../controllers/commonController");
// StudentRoutes is already imported above from "../models" on line 11


const getSchoolIdByStudentId = async (student_id) => {
  try {
    const guardian_id = req.user.user_id;
    const student = await Student.findOne({
      where: { id: student_id, guardian_id: guardian_id },
    });
    if (!student) return "student not found";

    const school_id = student.school_id;
    return school_id;
    // res.status(200).json({ school_id });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error getting school id by student id:",
      error,
    );
    return "error in getting school id";
  }
};

const getNoticeByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const guardian_id = req.user.user_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const student = await Student.findOne({
      where: { id: student_id, guardian_id: guardian_id, trash: false },
      attributes: ["class_id", "school_id"],
    });
    if (!student) return res.status(404).json({ error: "student not found" });
    const classId = student.class_id;
    const SchoolId = student.school_id;
    const whereClause = {
      trash: false,
      school_id: SchoolId,
      [Op.or]: [{ type: "all" }, { type: "classes" }],
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { content: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const notices = await Notice.findAll({
      where: whereClause,
      offset,
      limit,
      include: [
        {
          model: NoticeClass,
          attributes: ["class_id"],
          where: { class_id: classId },
          required: false,
          include: [
            {
              model: Class,
              attributes: ["classname"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
    const count = notices.length;
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      notices,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error getting notices by student id:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getPaymentByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const guardian_id = req.user.user_id;
    const student = await Student.findOne({
      where: { id: student_id, guardian_id: guardian_id },
    });
    if (!student) return res.status(404).json({ error: "student not found" });
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      student_id: student_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { payment_type: { [Op.like]: `%${searchQuery}%` } },
        { amount: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (date) {
      whereClause.payment_date = date;
    }
    const { count, rows: payment } = await Payment.findAndCountAll({
      offset,
      distinct: true, // Add this line
      limit,
      where: whereClause,
      include: [
        {
          model: InvoiceStudent,
          attributes: ["id", "invoice_id","student_id", "status"],
          required: false,
          include: [
            {
              model: Invoice,
              attributes: ["title", "category", "due_date", "amount"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      payment,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error getting payment by student id:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getInvoiceByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    if (!student_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const guardian_id = req.user.user_id;
    const student = await Student.findOne({
      where: { id: student_id, guardian_id: guardian_id },
    });
    if (!student) return res.status(404).json({ error: "student not found" });
    const whereClause = { trash: false };

    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { amount: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { rows: invoices, count } = await InvoiceStudent.findAndCountAll({
      offset,
      limit,
      distinct: true,
      where: { student_id: student_id },
      include: [
        {
          model: Invoice,
          where: whereClause,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      invoices,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error getting invoice by student id:",
      error,
    );
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};
const createPayment = async (req, res) => {
  try {
    const school_id = req.user.school_id;

    const {
      student_id,
      invoice_student_id,
      amount,
      payment_date,
      payment_type,
      transaction_id,
      payment_method,
    } = req.body;

    if (
      !student_id ||
      !school_id ||
      amount == null ||
      !invoice_student_id ||
      !payment_date ||
      !payment_type
    ) {
      return res.status(400).json({
        error: "Required fields are missing",
      });
    }

    const payment = await schoolSequelize.transaction(async (transaction) => {

      // Check transaction ID
      if (transaction_id) {
        const existingTransaction = await Payment.findOne({
          where: {
            transaction_id,
          },
          transaction,
        });

        if (existingTransaction) {
          throw new Error("Transaction ID already exists");
        }
      }

      // Check duplicate payment
      const existingPayment = await Payment.findOne({
        where: {
          school_id,
          student_id,
          amount,
          payment_date,
          payment_type,
        },
        transaction,
      });

      if (existingPayment) {
        throw new Error(
          "Payment with the same details already exists"
        );
      }

      const payment_attachmentUrl =
        req.uploadedFiles?.payment_attachment?.url || null;

      // Create payment
      const payment = await Payment.create(
        {
          school_id,
          student_id,
          invoice_student_id,
          amount,
          payment_date,
          payment_type,
          transaction_id: transaction_id || null,
          payment_method,
          payment_status: "pending",
          recorded_by: req.user.user_id,
          payment_attachment: payment_attachmentUrl,
        },
        {
          transaction,
        }
      );

      // Update invoice
      await InvoiceStudent.update(
        {
          status: "waiting_for_approval",
        },
        {
          where: {
            id: invoice_student_id,
          },
          transaction,
        }
      );

      return payment;
    });

    return res.status(201).json({
      message: "Payment created",
      payment,
    });

  } catch (error) {
    logger.error(
      "schoolId:",
      req.user.school_id,
      "createPayment:",
      error
    );

    if (error.message === "Transaction ID already exists") {
      return res.status(400).json({
        error: error.message,
      });
    }

    if (
      error.message ===
      "Payment with the same details already exists"
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: error.message,
    });
  }
};
//update payment
const updatePayment = async (req, res) => {
  try {
    const id = req.params.id;
    const school_id = req.user.school_id;
    const userId = req.user.user_id;
    const {
      amount,
      payment_date,
      transaction_id,
      payment_method,
    } = req.body;
    const payment = await Payment.findOne({
      where: { id, school_id, trash: false ,recorded_by:userId},
    });
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
  }
  if(payment.payment_status ==="completed") 
      return res.status(400).json({ error: "Payment already completed" });
    const existingTransaction_id = await Payment.findOne({
      where: { transaction_id, id: { [Op.ne]: req.params.id } },
    });
    if (
      existingTransaction_id &&
      existingTransaction_id.transaction_id !== ""
    ) {
      return res.status(400).json({ error: "Transaction ID already exists" });
    }
    const existingPayment = await Payment.findOne({
      where: {
        id: { [Op.ne]: req.params.id },
        school_id,
        amount: amount || payment.amount,
        payment_date: payment_date || payment.payment_date,
        payment_method: payment_method || payment.payment_method,
        payment_type: payment.payment_type,
        recorded_by:userId,
        student_id: payment.student_id,
        invoice_student_id: payment.invoice_student_id,
      },
    })
    if(existingPayment) return res.status(400).json({ error: "Payment with the same details already exists" });
  
    let fileName = req.body.payment_type;
    const newFile = req.uploadedFiles?.payment_attachment?.url || null;
    if (newFile) {
      if (payment.payment_attachment) {
        await deleteFile(payment.payment_attachment);
      }
      fileName = newFile;
    }
    await Payment.update(
      {
        amount: amount || payment.amount,
        payment_date: payment_date || payment.payment_date,
        transaction_id: transaction_id || payment.transaction_id,
        payment_method: payment_method || payment.payment_method,
        payment_attachment: fileName,
      },
      {
        where: { id },
      }
    );
    res.status(200).json({ message: "Payment updated successfully" });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "updatePayment:", error);
    res.status(500).json({ error: error.message });
  }
}
const createLeaveRequest = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    const {
      student_id,
      from_date,
      to_date,
      leave_type,
      reason,
      leave_duration,
      half_section,
    } = req.body;
    if (!student_id || !from_date || !to_date || !leave_type || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existingRequest = await LeaveRequest.findOne({
      where: {
        school_id: school_id,
        user_id: user_id,
        student_id: student_id,
        from_date: from_date,
        to_date: to_date,
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already exists" });
    }

    const fileUrl = req.uploadedFiles?.attachment?.url || null;
    const data = await LeaveRequest.create({
      school_id: school_id,
      user_id: user_id,
      student_id: student_id,
      role: "student",
      from_date: from_date,
      to_date: to_date,
      leave_type: leave_type,
      reason: reason,
      attachment: fileUrl,
      leave_duration,
      half_section,
    });
    res.status(201).json(data);
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error creating leave request:",
      error,
    );
    console.error("Create Error:", error);
    res.status(500).json({ error: "Failed to create leave request" });
  }
};

const getAllLeaveRequests = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    if (!school_id || !user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      school_id: school_id,
      user_id: user_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [{ reason: { [Op.like]: `%${searchQuery}%` } }];
    }
    if (date) {
      whereClause[Op.or] = [
        { from_date: { [Op.like]: `%${date}%` } },
        { to_date: { [Op.like]: `%${date}%` } },
      ];
    }
    const { count, rows: leaves } = await LeaveRequest.findAndCountAll({
      offset,
      distinct: true, // Add this line
      limit,
      where: whereClause,
      attributes: [
        "id",
        "from_date",
        "to_date",
        "leave_type",
        "leave_duration",
        "reason",
        "attachment",
        "leave_duration",
        "status",
        "admin_remarks",
        "half_section",
      ],
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      leaves,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching leave requests:",
      error,
    );
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};

const getLeaveRequestById = async (req, res) => {
  try {
    const Id = req.params.id;
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    if (!school_id || !user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const data = await LeaveRequest.findOne({
      where: {
        id: Id,
        user_id,
        school_id,
        trash: false,
      },
    });
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching leave request:",
      error,
    );
    console.error("Fetch One Error:", error);
    res.status(500).json({ error: "Failed to fetch leave request" });
  }
};

const updateLeaveRequest = async (req, res) => {
  try {
    const Id = req.params.id;
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    const {
      student_id,
      from_date,
      to_date,
      leave_type,
      reason,
      leave_duration,
      half_section,
    } = req.body;
    const data = await LeaveRequest.findByPk(Id);
    if (!data){
      return res.status(404).json({ error: "Leave request not found" });
    }
    const existingRequest = await LeaveRequest.findOne({
      where: {
        school_id: school_id,
        user_id: user_id,
        student_id: student_id,
        from_date: from_date,
        to_date: to_date,
        id: { [Op.ne]: Id },
      },
    });
    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already exists" });
    }
    let fileName = data.attachment;
    const newFileUrl = req.uploadedFiles?.attachment?.url || null;
    if (newFileUrl) {
      if (data.attachment) {
        await deleteFile(data.attachment);
      }
      fileName = newFileUrl;
    }
    await data.update({
      student_id: student_id,
      from_date: from_date,
      to_date: to_date,
      leave_type: leave_type,
      reason: reason,
      attachment: fileName ? fileName : null,
      leave_duration,
      half_section,
    });

    res.status(200).json(data);
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error updating leave request:",
      error,
    );
    console.error("Update Error:", error);
    res.status(500).json({ error: "Failed to update leave request" });
  }
};

const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    const school_id = req.user.school_id;
    const leave = await LeaveRequest.findOne({
      where: { id, user_id, school_id },
    });
    if (!leave) return res.status(404).json({ error: "Not found" });

    await leave.update({ trash: true });
    res.status(200).json("Successfully deleted");
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error deleting leave request:",
      error,
    );
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Failed to delete leave request" });
  }
};
const getStudentsUnderGuardianBySchoolId = async (req, res) => {
  try {
    const school_id = req.params.school_id;
    const user_id = req.user.user_id;
    if (!school_id || !user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const students = await Student.findAll({
      where: { school_id: school_id, guardian_id: user_id, trash: false },
      attributes: ["id", "full_name", "reg_no", "image"],
      include: [
        {
          model: Class,
          attributes: ["id", "classname", "year", "division"],
        },
      ],
    });
    if (!students || students.length === 0) {
      return res.status(404).json({ error: "No students found" });
    }
    res.status(200).json(students);
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching students:",
      error,
    );
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};
const getSchoolsByUser = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const schools = await Student.findAll({
      where: { guardian_id: user_id, trash: false },
      attributes: ["school_id"],
      include: [
        {
          model: School,
          attributes: [
            "id",
            "name",
            "address",
            "phone",
            "email",
            "logo",
            "bg_image",
          ],
        },
      ],
      group: ["school_id"],
    });
    if (!schools || schools.length === 0) {
      return res.status(404).json({ error: "No schools found" });
    }
    res.status(200).json({
      totalcontent: schools.length,
      schools,
    });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error fetching schools:", error);
    console.error("Error fetching schools:", error);
    return null;
  }
};
const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findOne({
       where: { id , trash: false}, 
       attributes:["id","name","address","phone","email","logo","bg_image","primary_colour","secondary_colour","status","location"],
    });
    if (!school) return res.status(404).json({ error: "School not found" });
    res.status(200).json({ school });
  } catch (error) {
    logger.error("role:", req.user.role,"userId:", req.user.user_id,"role:", req.user.role,"userId:", req.user.user_id,"Error getting school by ID:", error);
    res.status(500).json({ error: error.message });
  }
}

const getStaffsBySchoolId = async (req, res) => {
  try {
    const school_id = req.params.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || "";
    const role = req.query.role || "teacher";
    if (!school_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    let whereClause = { school_id: school_id, role: role, trash: false };
    if (searchQuery) {
      whereClause[Op.or] = [{ name: { [Op.like]: `%${searchQuery}%` } }];
    }
    const { count, rows: staffs } = await User.findAndCountAll({
      where: whereClause,
      attributes: ["id", "name", "email", "phone", "dp", "role", "createdAt"],
      include: [
        {
          model: Staff,
          attributes: [
            "id",
            "user_id",
            "school_id",
            "class_id",
            "role",
            "qualification",
            "address",
          ],
          include: [
            {
              model: Staffsubject,
              attributes: ["id", "staff_id", "subject_id"],
              include: [
                {
                  model: Subject,
                  attributes: ["id", "subject_name"],
                },
              ],
            },
            {
              model: Class,
              attributes: ["id", "classname", "year", "division"],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
      offset,
      distinct: true, // Add this line
      limit,
    });
    if (!staffs || staffs.length === 0) {
      return res.status(404).json({ error: "No staffs found" });
    }
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      staffs,
    });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error fetching staffs:", error);
    console.error("Error fetching staffs:", error);
    res.status(500).json({ error: "Failed to fetch staffs" });
  }
};
const getTodayTimetableByStudentId = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const guardian_id = req.user.user_id;
    const student = await Student.findOne({
      where: { id: student_id, guardian_id: guardian_id },
    });
    if (!student) return res.status(404).json({ error: "student not found" });
    const class_id = student.class_id;
    const school_id = student.school_id;

    let date = new Date();
    let today = date.getDay();
    let message = "today's timetable";

    // If time >= 19:00 (7PM), shift to tomorrow
    if (date.getHours() >= 19) {
      today = (today + 1) % 7;
      date.setDate(date.getDate() + 1); // Move to next day
      message = "tomorrow's timetable";
    }

    const timetable = await Timetable.findAll({
      where: {
        class_id,
        school_id,
        day_of_week: today,
      },

      order: [["period_number", "ASC"]],
      include: [
        { model: User, attributes: ["id", "name"] },
        { model: Subject, attributes: ["id", "subject_name"] }, // optional
        { model: Class, attributes: ["id", "classname"] }, // optional
      ],
    });
    //the class id used TimetableSubstitution get the substitutions for today
    const substitutions = await TimetableSubstitution.findAll({
      where: { date },
      include: [
        {
          model: Timetable,
          where: { class_id: class_id },
          attributes: ["id", "day_of_week", "class_id", "period_number"],
          required: true,
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
        {
          model: Subject,
          attributes: ["id", "subject_name"],
        },
      ],
    });

    return res.json({
      message: `Here is ${message}`,
      today,
      timetable,
      substitutions,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "getTodayTimetableForStaff error:",
      error,
    );
    console.error("getTodayTimetableForStaff error:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getAllDayTimetableByStudentId = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const guardian_id = req.user.user_id;
    const student = await Student.findOne({
      where: { id: student_id, guardian_id: guardian_id },
    });
    if (!student) return res.status(404).json({ error: "student not found" });
    const class_id = student.class_id;
    const school_id = student.school_id;
    const timetable = await Timetable.findAll({
      where: {
        class_id,
        school_id,
      },
      attributes: [
        "id",
        "day_of_week",
        "period_number",
        "subject_id",
        "staff_id",
        "createdAt",
      ],
      order: [
        ["day_of_week", "ASC"],
        ["period_number", "ASC"],
      ],
      include: [
        { model: User, attributes: ["id", "name"] },
        { model: Subject, attributes: ["id", "subject_name"] }, // optional
        { model: Class, attributes: ["id", "classname"] }, // optional
      ],
    });
    const grouped = timetable.reduce((acc, entry) => {
      const day = entry.day_of_week;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(entry);
      return acc;
    }, {});

    // Convert grouped object to array with "day_of_week" key
    const formatted = Object.keys(grouped).map((day) => ({
      day_of_week: parseInt(day),
      periods: grouped[day],
    }));

    return res.json({
      student_id,
      class_id,
      school_id,
      timetable: formatted,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "getAllDayTimetableByStudentId error:",
      error,
    );
    console.error("getAllDayTimetableByStudentId error:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getNavigationBarCounts = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;

    const unreadChatCount = await Chat.findAll({
      where: {
        [Op.or]: [{ user1_id: user_id }, { user2_id: user_id }],
      },
      include: [
        {
          model: Message,
          attributes: ["id", "receiver_id", "status"],
          where: { status: { [Op.ne]: "read" }, trash: false },
        },
      ],
    });
    res.json({
      unreadChatCount: unreadChatCount.length,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching pending leave request counts by role:",
      error,
    );
    console.error(
      "Error fetching pending leave request counts by role:",
      error,
    );
    res
      .status(500)
      .json({ error: "Failed to fetch pending leave request counts" });
  }
};
// Update guardian profile details from guardian table
const updateProfileDetails = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      guardian_relation,
      guardian_job,
      guardian2_relation,
      guardian2_name,
      guardian2_job,
      guardian2_contact,
      father_name,
      mother_name,
      house_name,
      street,
      city,
      landmark,
      district,
      state,
      country,
      post,
      pincode,
    } = req.body;
    const guardian = await Guardian.findOne({
      where: { user_id: userId },
    });

    if (!guardian) return res.status(404).json({ error: "Guardian not found" });

    await guardian.update({
      guardian_relation: normalizeGuardianRelation(guardian_relation),
      guardian_job,
      guardian2_relation: normalizeGuardianRelation(guardian2_relation),
      guardian2_name,
      guardian2_job,
      guardian2_contact,
      father_name,
      mother_name,
      house_name,
      street,
      city,
      landmark,
      district,
      state,
      country,
      post,
      pincode,
    });
    const user = await User.findOne({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const newDpUrl = req.uploadedFiles?.dp?.url || null;
    let finalDp = user.dp;

    if (newDpUrl) {
      if (user.dp) {
        await deleteFile(user.dp);
      }
      finalDp = newDpUrl;
      await user.update({ dp: finalDp });
    }

    res
      .status(200)
      .json({ message: "Guardian profile updated", guardian, user });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error updating guardian profile:",
      error,
    );
    console.error("Error updating guardian profile:", error);
    res.status(500).json({ error: error.message });
  }
};
const changeIdentifiersAndName = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { guardian_email, guardian_name, guardian_contact } = req.body;

    const guardian = await Guardian.findOne({
      where: { user_id: userId },
    });

    if (!guardian) return res.status(404).json({ error: "Guardian not found" });
    if (guardian_contact) {
      const existingPhone = await User.findOne({
        where: {
          phone: guardian_contact,
          id: { [Op.ne]: userId },
        },
      });

      if (existingPhone) {
        return res
          .status(400)
          .json({ error: "Guardian phone already exists in user table" });
      }
      await User.update({ phone: guardian_contact }, { where: { id: userId } });
    }
    if (guardian_email) {
      const existingEmail = await User.findOne({
        where: {
          email: guardian_email,
          id: { [Op.ne]: userId },
        },
      });

      if (existingEmail) {
        return res
          .status(400)
          .json({ error: "Guardian email already exists in user table" });
      }
      await User.update(
        { email: guardian_email },
        {
          where: { id: userId },
        },
      );
    }
    if (guardian_name) {
      await User.update(
        { name: guardian_name },
        {
          where: { id: userId },
        },
      );
    }
    await guardian.update({
      guardian_email,
      guardian_name,
      guardian_contact,
    });
    res.status(200).json({ message: "Guardian Identifiers updated", guardian });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error updating guardian profile:",
      error,
    );
    console.error("Error updating guardian profile:", error);
    res.status(500).json({ error: error.message });
  }
};

//update ownstudent profile details in student table
const updateStudentProfile = async (req, res) => {

  try {
   
    const userId = req.user.user_id;
    const { student_id } = req.params;
    const { address } = req.body;
    const student = await Student.findOne({
      where: { id: student_id, guardian_id: userId },
    });
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Existing image
    let finalImage = student.image;

    // New uploaded image from MinIO
    const newImageUrl = req.uploadedFiles?.image?.url || null;

    if (newImageUrl) {
      // Delete old image from MinIO
      if (student.image) {
        await deleteFile(student.image);
      }

      finalImage = newImageUrl;
    }

    await student.update({
      image: finalImage,
      address,
    });
    res.status(200).json({ message: "Student profile updated", student });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error updating student profile:",
      error,
    );
    console.error("Error updating student profile:", error);
    res.status(500).json({ error: error.message });
  }
};
const getProfileDetails = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const guardian = await Guardian.findOne({
      where: { user_id: user_id },
      attributes: [
        "guardian_name",
        "guardian_contact",
        "guardian_email",
        "guardian_job",
        "guardian_relation",
        "guardian2_name",
        "guardian2_contact",
        "guardian2_job",
        "guardian2_relation",
        "father_name",
        "mother_name",
        "house_name",
        "street",
        "city",
        "landmark",
        "district",
        "state",
        "country",
        "post",
        "pincode",
      ],
    });
    if (!guardian) return res.status(404).json({ error: "Guardian not found" });
    const user = await User.findOne({
      where: { id: user_id },
      attributes: ["name", "email", "phone", "dp"],
    });

    res
      .status(200)
      .json({ message: "Guardian profile details", guardian, user });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error getting guardian profile details:",
      error,
    );
    console.error("Error getting guardian profile details:", error);
    res.status(500).json({ error: error.message });
  }
};
const updateHomeworkAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const guardian_id = req.user.user_id;
    const assignment = await HomeworkAssignment.findByPk(id);
    if (!assignment) return res.status(404).json({ error: "homework assignment not found" });
    const student = await Student.findOne({
      where: { id: assignment.student_id, guardian_id: guardian_id },
    });
    if (!student) return res.status(404).json({ error: "student not found" });
    
    let fileName = assignment.solved_file;
    const newFileUrl = req.uploadedFiles?.solved_file?.url || null;
    if (newFileUrl) {
      if (assignment.solved_file) {
        await deleteFile(assignment.solved_file);
      }
      fileName = newFileUrl;
    }
 
    await assignment.update({
      remarks,
      solved_file: fileName,
    });
    res.status(200).json({ message: "Updated successfully", assignment });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error updating homework assignment:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};

const getAchievementById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const achievement = await Achievement.findOne({
      where: { id: req.params.id, school_id, trash: false },
      attributes: [
        "id",
        "title",
        "description",
        "category",
        "level",
        "date",
        "awarding_body",
      ],
      include: [
        {
          model: StudentAchievement,
          attributes: ["student_id", "status", "proof_document", "remarks"],
          include: [
            {
              model: Student,
              attributes: ["id", "full_name", "reg_no", "image"],
              include: [
                {
                  model: Class,
                  attributes: ["id", "classname", "year", "division"],
                },
              ],
            },
          ],
        },
      ],
      order:[["createdAt", "DESC"]]
    });
    if (!achievement) return res.status(404).json({ error: "Not found" });
    res.status(200).json(achievement);
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error getting achievement by id:",
      error,
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

//get routes with student name and route name
const getRoutesForGuardian = async (req, res) => {
  try {
    const guardianId = req.user.user_id;
    const school_id = req.user.school_id;

    if (!guardianId || !school_id) {
      return res.status(400).json({
        error: "Invalid user id or school id",
      });
    }

    const students = await Student.findAll({
      where: {
        guardian_id: guardianId,
        school_id: school_id,
        trash: false,
      },
      attributes: ["id", "full_name", "reg_no"],
      include: [
        {
          model: StudentRoutes,
          as: "routes",
          attributes: ["id", "route_name", "type", "active"],
          through: { attributes: [] },
          required: true,
          where: {
            active: true,
            trash: false,
          },
          include: [
            {
              model: School,
              as: "school",
              attributes: ["id"],
              where: {
                id: school_id,
              },
            },
          ],
        },
      ],
    });

    const result = students.map((student) => {
      return {
        id: student.id,
        full_name: student.full_name,
        reg_no: student.reg_no,
        routes: student.routes.map((route) => ({
          id: route.id,
          route_name: route.route_name,
          type: route.type,
        })),
      };
    });

    return res.status(200).json({
      message: "Routes fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Guardian route fetch error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

const getExamsByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const guardian_id = req.user.user_id;

    const student = await Student.findOne({
      where: { id: studentId, guardian_id: guardian_id, trash: false },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const marks = await Mark.findAll({
      where: { student_id: studentId },
      attributes: ["internal_id"],
    });

    const internalIds = marks.map((mark) => mark.internal_id);

    if (internalIds.length === 0) {
      return res.status(200).json({ exams: [] });
    }

    const internalMarks = await InternalMark.findAll({
      where: {
        id: { [Op.in]: internalIds },
        exam_id: { [Op.ne]: null },
      },
      attributes: ["exam_id"],
      group: ["exam_id"],
    });

    const examIds = internalMarks.map((im) => im.get("exam_id"));

    if (examIds.length === 0) {
      return res.status(200).json({ exams: [] });
    }

    const examsList = await Exams.findAll({
      where: {
        id: { [Op.in]: examIds },
        publish: true,
      },
      attributes: ["id", "exam_name", "education_year"],
    });

    return res.status(200).json({ exams: examsList });
  } catch (error) {
    logger.error(
      "userId:",
      req.user ? req.user.user_id : null,
      "Error getting exams by student id:",
      error,
    );
    return res.status(500).json({ error: error.message });
  }
};

//get total count of routes
const getGuardianRouteCount = async (req, res) => {
  try {
    const guardianId = req.user.user_id;
    const school_id = req.user.school_id;

    if (!guardianId || !school_id) {
      return res.status(400).json({
        error: "Invalid user id or school id",
      });
    }

    const students = await Student.findAll({
      where: {
        guardian_id: guardianId,
        school_id,
        trash: false,
      },
      attributes: [],
      include: [
        {
          model: StudentRoutes,
          as: "routes",
          attributes: ["id"],
          required: true,
          include: [
            {
              model: School,
              as: "school",
              attributes: ["id"],
              where: {
                id: school_id,
              },
            },
          ],
        },
      ],
    });

    const uniqueRoutes = new Set(students.map((student) => student.route.id));

    return res.status(200).json({
      message: "Route count fetched successfully",
      total_routes: uniqueRoutes.size,
    });
  } catch (error) {
    console.error("Guardian route count error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

// fetches stops for a specific route from your database.
const getStopsByRouteId = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { route_id } = req.query;

    if (!route_id) {
      return res.status(400).json({ message: "route_id is required" });
    }

    const stops = await stop.findAll({
      where: { route_id, school_id, trash: false },
      order: [["priority", "ASC"]],
    });

    return res.status(200).json({
      message: "Stops fetched successfully",
      data: stops,
    });
  } catch (error) {
    console.error("Error fetching stops:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//fetch all arrived route for their student for guardian
const getStopsForParent = async (req, res) => {
  try {
    const { route_id } = req.params;
    const user_id = req.user.user_id;
    const school_id = req.user.school_id;
    const guardian = await Guardian.findOne({
      where: {
        user_id,
        trash: false,
      },
    });
    if (!guardian) {
      return res.status(404).json({ message: "guardian not found" });
    }
    const stops = await stop.findAll({
      where: { route_id, trash: false },
      attributes: ["id", "stop_name", "priority", "arrived"],
      include: [
        {
          model: StudentRoutes,
          as: "route",
          attributes: ["route_name", "type"],
          include: [
            {
              model: School,
              as: "school",
              attributes: ["id"],
              where: {
                id: school_id,
              },
            },
          ],
        },
      ],
    });

    const result = stops.map((s) => {
      return {
        id: s.id,
        stop_name: s.stop_name,
        priority: s.priority,
        route_name: s.route.route_name,
        route_type: s.route.type,
        arrived: s.arrived,
      };
    });

    return res.status(200).json({
      message: "Stops fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching stops:", error);
    return res.status(500).json({
      error: "Failed to fetch stops",
    });
  }
};

const getExamMarksByStudentId = async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const guardian_id = req.user.user_id;

    const student = await Student.findOne({
      where: { id: studentId, guardian_id: guardian_id, trash: false },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const exam = await Exams.findOne({ where: { id: examId } });

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const internalMarks = await InternalMark.findAll({
      where: { exam_id: examId, trash: false },
      include: [
        {
          model: Subject,
          attributes: ["id", "subject_name"],
        },
        {
          model: Mark,
          where: { student_id: studentId },
          required: true,
        },
      ],
    });

    const marksList = internalMarks.map((im) => {
      const studentMark = im.Marks && im.Marks.length > 0 ? im.Marks[0] : null;
      return {
        internal_mark_id: im.id,
        subject: im.Subject ? im.Subject.subject_name : null,
        internal_name: im.internal_name,
        max_marks: im.max_marks,
        date: im.date,
        marks_obtained: studentMark ? studentMark.marks_obtained : null,
        status: studentMark ? studentMark.status : "absent",
      };
    });

    const response = {
      marks: marksList,
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error(
      "userId:",
      req.user ? req.user.user_id : null,
      "Error getting exam marks by student id:",
      error,
    );
    return res.status(500).json({ error: error.message });
  }
};
const getParentNotesByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const school_id = req.user.school_id;
    const guardian_id = req.user.user_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const student = await Student.findOne({
      where: { id: student_id, guardian_id: guardian_id, trash: false },
    });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    let whereClause = { 
      school_id,
      trash: false, 
       };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { note: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { rows: notes, count } = await ParentNote.findAndCountAll({
      offset,
      limit,
      distinct: true,
      where: whereClause,
      include: [
        {
          model: ParentNoteStudent,
          attributes: ["id", "student_id", "status"],
          where: { student_id, trash: false },
          required: true,
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      data: notes,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user ? req.user.user_id : null,
      "Error getting parent notes by student id:",
      error,
    );
    return res.status(500).json({ error: error.message });
  }
};
const getParentNotesByIdAndStudentId = async (req, res) => {
  try {
    const { id, student_id } = req.params;
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;
    if(!id || !student_id){
      return res.status(404).json({ error: "Missing required fields" });
    }
    const student = await Student.findOne({
      where: { id: student_id, guardian_id: recorded_by, trash: false },
    });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
     const note = await ParentNote.findOne({
      where: { id, school_id, trash: false },
      include: [
        {
          model: ParentNoteStudent,
          attributes: ["id", "student_id", "status"],
          where: { student_id, trash: false },
          required: false,
          include: [
            {
              model: Student,
              attributes: ["id", "full_name", "reg_no", "class_id"],
            },
          ],
        },
      ],
    });
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    await ParentNoteStudent.update(
      { status: true },
      { where: { parentnote_id: id, student_id } }
    )
    return res.status(200).json(note);
  } catch (error) {
    logger.error(
      "userId:",
      req.user ? req.user.user_id : null,
      "Error getting parent notes by id:",
      error,
    );
    return res.status(500).json({ error: error.message });
  }
}
const getParentNoteUnseenCount = async (req, res) => {
  try {
    const { student_id } = req.params;
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;
    const student = await Student.findOne({
      where: { id: student_id, guardian_id: recorded_by, trash: false },
    });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
  const unseednCount = await ParentNoteStudent.count({
    where: { student_id, status: false },
  });
  return res.status(200).json({ unseenCount: unseednCount });
  } catch (error) {
    logger.error(
      "userId:",
      req.user ? req.user.user_id : null,
      "Error getting parent notes by id:",
      error,
    );
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  updateHomeworkAssignment,

  getSchoolIdByStudentId,

  getNoticeByStudentId,
  getPaymentByStudentId,
  getInvoiceByStudentId,
  createPayment,
  updatePayment,

  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest,

  getStudentsUnderGuardianBySchoolId,
  getSchoolsByUser,
  getSchoolById,
  getStaffsBySchoolId,

  getTodayTimetableByStudentId,
  getAllDayTimetableByStudentId,

  getNavigationBarCounts,
  updateStudentProfile,
  updateProfileDetails,
  changeIdentifiersAndName,
  getProfileDetails,

  getAchievementById,
  getRoutesForGuardian,
  getExamsByStudentId,
  getExamMarksByStudentId,
  getGuardianRouteCount,
  getStopsByRouteId,
  getStopsForParent,

  getParentNotesByStudentId,
  getParentNotesByIdAndStudentId,
  getParentNoteUnseenCount,
};
