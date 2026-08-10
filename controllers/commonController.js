const { Op, where, DATEONLY } = require("sequelize");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");

const User = require("../models/user");
const Student = require("../models/student");
const HomeworkAssignment = require("../models/homeworkassignment");
const Homework = require("../models/homework");
const AttendanceMarked = require("../models/attendancemarked");
const Attendance = require("../models/attendance");
const Achievement = require("../models/achievement");
const StudentAchievement = require("../models/studentachievement");
const InternalMark = require("../models/internal_marks");
const Subject = require("../models/subject");
const Marks = require("../models/marks");
const LeaveRequest = require("../models/leaverequest");
const School = require("../models/school");
const Event = require("../models/event");
const News = require("../models/news");
const Payment = require("../models/payment");
const AccountDelete = require("../models/accountdelete");
const Syllabus = require("../models/syllabus");
const NewsImage = require("../models/newsimage");
const SpecialClassStudent = require("../models/special_class_students");
const InvoiceStudent = require("../models/invoice_students");
const Invoice = require("../models/invoice");
const Guardian = require("../models/guardian");
const Driver = require("../models/tracker/driver");
const Notice = require("../models/notice");
const { deleteFile } = require("../middlewares/storageUploads");

const { Class, Staff } = require("../models");
const { get } = require("../routes/schoolAdminRoutes");

const getStudentsByClassId = async (req, res) => {
  try {
    const { class_id } = req.params;
    const school_id = req.user.school_id || "";
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }

    const classRecord = await Class.findOne({
      where: { id: class_id, school_id, trash: false },
    });
    if (!classRecord) {
      return res.status(404).json({ error: "Class not found" });
    }

    let students = [];
    let count = 0;
    const studentAttributes = ["id", "full_name", "roll_number", "class_id", "image"];
    const studentInclude = [
      { model: Class, attributes: ["id", "year", "division", "classname"] },
    ];

    if (classRecord.special === false) {
      const result = await Student.findAndCountAll({
        where: {
          class_id,
          school_id,
          full_name: { [Op.like]: `%${searchQuery}%` },
          trash: false,
          alumni: false,
        },
        attributes: studentAttributes,
        include: studentInclude,
        order: [["roll_number", "ASC"]],
        limit,
        offset,
        distinct: true,
      });
      count = result.count;
      students = result.rows;
    } else {
      const assignments = await SpecialClassStudent.findAll({
        where: { class_id },
        order: [["createdAt", "DESC"]],
      });
      const studentIds = assignments.map((entry) => entry.student_id);

      if (studentIds.length > 0) {
        const result = await Student.findAndCountAll({
          where: {
            id: studentIds,
            school_id,
            full_name: { [Op.like]: `%${searchQuery}%` },
            trash: false,
            alumni: false,
          },
          attributes: studentAttributes,
          include: studentInclude,
          order: [["roll_number", "ASC"]],
        });
        count = result.count;
        students = result.rows;
      }
    }
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      students,
    });
  } catch (error) {
    console.error("Error fetching students by class ID:", error);
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching students by class ID:",
      error
    );
    res.status(500).json({ error: "Failed to fetch students by class ID" });
  }
};
const getSpecialClassStudentsByClassId = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const { class_id } = req.params;

    const classRecord = await Class.findOne({
      where: { id: class_id, school_id, trash: false },
    });

    if (!classRecord) {
      return res.status(404).json({ error: "Class not found" });
    }

    const assignments = await SpecialClassStudent.findAll({
      where: { class_id },
      order: [["createdAt", "DESC"]],
    });

    const studentIds = assignments.map((entry) => entry.student_id);
    const students = await Student.findAll({
      where: { id: studentIds, school_id, trash: false },
      attributes: ["id", "full_name", "roll_number", "class_id", "image"],
    });

    res.status(200).json({
      class: classRecord,
      students,
    });
  } catch (error) {
    logger.error("schoolId:", req.user.school_id, "getSpecialClassStudents:", error);
    res.status(500).json({ error: error.message });
  }
};
const getschoolIdByStudentId = async (student_id) => {
  try {
    const student = await Student.findByPk(student_id);
    if (!student) 
      return res.status(404).json({ error: "student not found" });
    const school_id = student.school_id;
    return school_id;
    // res.status(200).json({ school_id });
  } catch (error) {
    return "error in getting school id";
  }
};
const getClassesByYear = async (req, res) => {
  try {
    const year = req.params.year;
    const school_id = req.user.school_id;
    const classData = await Class.findAll({
      where: {
        year: year,
        school_id,
      },
      attributes: ["id", "division", "classname", "special"],
    });

    if (!classData) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(classData);
  } catch (error) {
    res.status(500).json({ error: error.message });
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching classes by year:",
      error
    );
  }
};
const getStaffsForFilter = async (req, res) => {
  const school_id = req.user.school_id;
  try {
    const searchQuery = req.query.q || "";
    let whereClause = {
      role: "teacher",
      school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchQuery}%` } },
        { phone: { [Op.like]: `%${searchQuery}%` } },
        ,
      ];
    }
    const staffs = await User.findAll({
      where: whereClause,
      attributes: ["id", "name", "phone"],
    });
    res.status(200).json(staffs);
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching staffs for filter:",
      error
    );
    res.status(500).json({ error: error.message });
  }
};
const getStudentDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id || "";
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }
    const student = await Student.findOne({
      where: { id, school_id, trash: false },
      attributes: [
        "id",
        "full_name",
        "reg_no",
        "roll_number",
        "class_id",
        "image",
        "date_of_birth",
        "gender",
        "address",
        "admission_date",
        "status",
      ],
      include: [
        { 
          model: User, attributes: ["id", "name", "email", "phone", "dp"] ,
          include: [
            {
              model: Guardian,
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
              ],            },
          ]

        },

        {
          model: Class,
          attributes: ["id", "year", "division", "classname"],
        },
      ],
    });

    if (!student) return res.status(404).json({ error: "Student not found" });
   const specialClass = await SpecialClassStudent.findAll({
     where: { student_id: student.id },
     attributes: ["class_id"],
     include: [
       {
         model: Class,
         attributes: ["id", "year", "division", "classname"],
       },
     ],
   })
    res.status(200).json(student,
      {
        specialClass
      }
    );
  } catch (error) {
    console.error("Error getting student:", error);
    logger.error("userId:", req.user.user_id, "Error getting student:", error);
    res.status(500).json({ error: "Failed to get student" });
  }
};
const getGuarduianIdbyStudentId = async (student_id) => {
  try {
    const school_id = req.user.school_id;
    const student = await Student.findOne({
      where: { id: student_id, school_id, trash: false },
    });
    if (!student) {
      return "student not found";
    }
    const guardian_id = student.guardian_id;
    return guardian_id;
  } catch (error) {
    console.error("Error in getting guardian id:", error);
    return "error in getting guardian id";
  }
};
// by student id
const getHomeworkByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const school_id = req.user.school_id;
    const student = await Student.findOne({
      where: { id: student_id, school_id, trash: false },
    });
    if (!student) return res.status(404).json({ error: "student not found" });

    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    let whereClause = {
    school_id,
    trash: false,
    };

    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows } = await Homework.findAndCountAll({
      offset,
      limit,
      distinct: true,
      where: whereClause,
      attributes: [
        "id",
        "title",
        "description",
        "due_date",
        "class_id",
        "createdAt",
      ],
      include: [
        {
          model: HomeworkAssignment,
          required: true,
          where: { student_id: student_id },
          attributes: ["id"],
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
        {
          model: Subject,
          attributes: ["id", "subject_name"],
        },
        {
          model: Class,
          attributes: ["id", "classname"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });
    const grouped = rows.reduce((acc, hw) => {
      const dateKey = hw.createdAt.toISOString().split("T")[0];
      // const dateKey = hw.createdAt;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(hw);
      return acc;
    }, {});

    const groupedHomework = Object.keys(grouped).map((date) => ({
      date,
      homeworks: grouped[date],
    }));
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      groupedHomework,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting homework by student id:",
      error
    );
    res.status(500).json({ error: error.message });
  }
};
const getHomeworkByIdAndStudentId = async (req, res) => {
  try {
    const { id, student_id } = req.params;
    const school_id = req.user.school_id;
    if(!id || !student_id) return res.status(400).json({ error: "Missing required parameters" });
    const homework = await Homework.findOne({
      where: { id, school_id },
      attributes: ["id", "title", "description", "due_date","file","type"],
      include: [
        {
          model: HomeworkAssignment,
          required: true,
          where: { student_id : student_id },
          attributes: ["id", "remarks", "points", "solved_file"],
          include: [
            {
              model: Student,
              attributes: ["id", "full_name", "reg_no", "roll_number"],
            },
          ],
        },
        {model: Class,attributes: ["id", "classname"], },
        {model: Subject,attributes: ["id", "subject_name"],},
        {model: User, attributes: ["id", "name"] },

      ],
  });
    if (!homework) return res.status(404).json({ error: "Not found" });
    res.status(200).json(homework);
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error getting homework by id:",
      error,
    );
    res.status(500).json({ error: error.message });
  }
};
const getAttendanceByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const school_id = req.user.school_id;
    const student = await Student.findOne({
      where: { id: student_id, school_id, trash: false },
    });
    if (!student) return res.status(404).json({ error: "student not found" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: attendance } = await AttendanceMarked.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { student_id: student_id },
      attributes: ["id", "status", "remarks"],
      include: [
        {
          model: Attendance,
          attributes: ["id", "date", "period"],

          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      attendance,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting attendance by student id:",
      error
    );
    res.status(500).json({ error: error.message });
  }
};
const getStudentProfile = async (req, res) => {
  try {
    const { student_id } = req.params;
    const school_id = req.user.school_id;
    const schooldata = await School.findOne({ where: { id: school_id } });
    const education_year_start =
      schooldata.education_year_start || process.env.EDUCATION_YEAR_START;

    const student = await Student.findOne({
       where: { id: student_id, school_id } ,
       attributes: ["id","full_name","roll_number","reg_no","class_id","image"],
       include: [
        {
          model: Class,
          attributes: ["id", "classname"],
        },
       ]
      });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    const Attendancedata = await AttendanceMarked.findAll({
      where: { student_id },
      include: [
        {
          model: Attendance,
          attributes: ["date"],
          where: { date: { [Op.gte]: education_year_start }, trash: false ,school_id},
        }, 
      ]
    });
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
    res.status(200).json({
      message: "Attendance count by student ID",
      attendanceSummary,
      student
    
    });
  } catch (error) {
    logger.error("Error generating student report:", error);
    console.error("Error generating student report:", error);
    res.status(500).json({ error: "Failed to generate student report" });
  }
};
const getStudentAttendanceByDate = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const school_id = req.user.school_id;
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const student = await Student.findOne({
      where: { id: student_id, school_id, trash: false },
    });
    if (!student) return res.status(404).json({ error: "student not found" });
  

    let whereClause = {  trash: false };
    if (date) {
      whereClause.date = date;
    }
    const { count, rows: attendance } = await AttendanceMarked.findAndCountAll({
      offset,
      distinct: true,
      limit,

      where: { student_id: student_id },
      attributes: ["id", "status", "remarks"],
      include: [
        {
          model: Attendance,
          where: whereClause,
          attributes: ["id", "date", "period"],

          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
    });
    if (!attendance) return res.status(404).json({ error: "Not found" });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      attendance_count:attendance.length,
      totalcontent: count,
      totalPages,
      currentPage: page,
      attendance,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting student attendance by date:",
      error
    );
    res.status(500).json({ error: error.message });
  }
};
const allAchievements = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }

    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      school_id: school_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: achievements } = await Achievement.findAndCountAll({
      offset,
      distinct: true, // Add this line
      limit,
      where: whereClause, // Add this line
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
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      achievements,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting all achievements:",
      error
    );
    res.status(500).json({ error: error.message });
  }
};
const achievementByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const school_id = req.user.school_id;
    const student = await Student.findOne({
      where: { id: student_id, school_id, trash: false },
    });
    if (!student) return res.status(404).json({ error: "student not found" });
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: achievement } =
      await StudentAchievement.findAndCountAll({
        offset,
        distinct: true, // Add this line
        limit,
        where: { student_id: student_id },
        attributes: ["id", "status", "proof_document", "remarks"],
        include: [
          {
            model: Achievement,
            where: whereClause,
            attributes: [
              "id",
              "title",
              "description",
              "category",
              "level",
              "date",
            ],
          },
        ],
      });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      achievement,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting achievement by student id:",
      error
    );
    res.status(500).json({ error: error.message });
  }
};
//get internalmark by student id
const getInternalMarkByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Assuming you have a model for InternalMark
    const { count, rows: Mark } = await Marks.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { student_id: student_id },

      include: [
        {
          model: InternalMark,
          where: {
            trash: false,
            school_id: school_id,
          },
          include: [
            {
              model: Subject,
              attributes: ["id", "subject_name"],
            },
          ],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      Mark,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error in getting internal mark by student id:",
      error
    );
    res.status(500).json({ error: error.message });
  }
};
const getLeaveRequestByStudentId = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const school_id = req.user.school_id;
    if (!school_id) {
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
      student_id: student_id,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { reason: { [Op.like]: `%${searchQuery}%` } },
        { leave_type: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (date) {
      whereClause[Op.or] = [
        { from_date: { [Op.like]: `%${date}%` } },
        { to_date: { [Op.like]: `%${date}%` } },
      ];
    }
    const { count, rows: leaves } = await LeaveRequest.findAndCountAll({
      offset,
      distinct: true,
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
      ],
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
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
      error
    );
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};
const getPaymentByStudnetId = async (req, res) => {
  try {
    const student_id = req.params.student_id;
    const school_id = req.user.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const payment_type = req.query.payment_type || "";
    const payment_status = req.query.payment_status || "";
    let whereClause = {
      student_id: student_id,
      school_id: school_id,
      trash: false
    };
    
    if(payment_type){
      whereClause.payment_type = payment_type
    };
    if(payment_status){
      whereClause.payment_status = payment_status
    }
     const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
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
      distinct: true
    });
  const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      payments });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching payments:",
      error
    );
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
  };
  const getPaymentById = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }

    const payment = await Payment.findOne({
      where: { id: req.params.id, school_id, trash: false },
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "image"],
        },
      ],
    });
    if (!payment || payment.trash)
      return res.status(404).json({ error: "Payment not found" });
    res.status(200).json(payment);
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error fetching payment:", error);
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: error.message });
  }
};
  const getInvoiceByStudentId = async (req, res) => {
   try{
    const student_id = req.params.student_id;
    const school_id = req.user.school_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || "";
    let whereClause = {
      school_id: school_id,
      trash: false
    };
    
    if(searchQuery){
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: invoices } = await InvoiceStudent.findAndCountAll({
      where: { student_id: student_id },
      include: [
        {
          model: Invoice,
          where: whereClause,
          attributes: ["title", "amount", "due_date"],
        },
      ],
      offset,
      limit,
    });
    
   const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      invoices,
    });
   }catch(error){
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching payments:",
      error
    );
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
   }
  };    

const getLatestEvents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;
    const { count, rows: events } = await Event.findAndCountAll({
      where: { school_id: school_id },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset,
      distinct: true,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      events,
    });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error fetching events:", error);
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};
const getLatestNews = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;
    const { count, rows: news } = await News.findAndCountAll({
      where: { school_id: school_id, trash: false },
      include: [
        {
          model: NewsImage,
          as: "images",
          attributes: ["id", "image_url", "caption"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset,
      distinct: true,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      news,
    });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error fetching news:", error);
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
};
const getLatestNotices = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;
    const { count, rows: notices } = await Notice.findAndCountAll({
      where: {
        school_id: school_id,
        [Op.or]: [{ type: "all" }, { type: "staffs" }],
      },
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset,
      distinct: true,
    });
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
      "Error fetching latest notices:",
      error,
    );
    console.error("Error fetching notices:", error);
    res.status(500).json({ error: "Failed to fetch notices" });
  }
};
const getSchoolDetails = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const school = await School.findByPk(school_id, {
      attributes: [
        "id",
        "name",
        "address",
        "phone",
        "email",
        "logo",
        "period_count",
        "attendance_count",
        "syllabus_id",
        "primary_colour",
        "secondary_colour",
        "bg_image",
      ],
      include: [
        {
          model: Syllabus,
          attributes: ["name"],
        },
      ],
    });
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    const staff = await Staff.findOne({
      attributes: [],
      where: { user_id: req.user.user_id }, include: {
        model: Class,
        attributes: ["id", "classname"],
      }
    });

    res.status(200).json({ ...school.toJSON(), Class: staff?.Class });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching school details:",
      error
    );
    console.error("Error fetching school details:", error);
    res.status(500).json({ error: "Failed to fetch school details" });
  }
};
const changePassword = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error changing password:", error);
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
const updateFcmToken = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { fcm_token } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.fcm_token = fcm_token;
    await user.save();
    res.status(200).json({ message: "FCM token updated successfully" });
  } catch (error) {
    logger.error("userId:", req.user.user_id, "Error updating FCM token:", error);
    console.error("Error updating FCM token:", error);
    res.status(500).json({ error: "Failed to update FCM token" });
  }
};
//
const updateDp = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let finalDp = user.dp;
    const dpField = req.uploadedFiles?.dp || req.uploadedFiles?.file;
    const newDpUrl = Array.isArray(dpField)
      ? dpField[0]?.url
      : dpField?.url || null;

    if (newDpUrl) {
      if (user.dp) {
        await deleteFile(user.dp);
      }
      finalDp = newDpUrl;
    }

    await user.update({ dp: finalDp });

    res.status(200).json({ message: "Profile picture updated successfully" });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error updating profile picture:",
      error
    );
    console.error("Error updating profile picture:", error);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
};

const getAchievementsBySchool = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    if (!school_id) {
      return res.status(404).json({ error: "School not found" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;
    const whereClause = {
      school_id,
      trash: false,
      level: {
        [Op.ne]: "class",
      },
    };
    const count = await Achievement.count({ where: whereClause });
    const achievements = await Achievement.findAll({
      where: whereClause,
      include: [
        {
          model: StudentAchievement,
          attributes: ["status", "remarks"],
          include: [
            {
              model: Student,
              attributes: ["id", "full_name", "reg_no", "image"],
              include: [
                {
                  model: Class,
                  attributes: ["id", "classname"],
                },
              ],
            },
          ],
        },
      ],
      limit,
      offset,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      achievements,
    });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error fetching achievements:",
      error
    );
    console.error("Error fetching achievements:", error);
    res.status(500).json({ error: error.message });
  }
};
const accountDeleteRequests = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const reason = req.body.reason || "";

    const existingRequest = await AccountDelete.findOne({
      where: { user_id: userId },
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Delete request already exists" });
    }

    const deleteRequest = await AccountDelete.create({
      user_id: userId,
      reason,
    });

    res
      .status(200)
      .json({ message: "Delete request created successfully", deleteRequest });
  } catch (error) {
    logger.error(
      "userId:",
      req.user.user_id,
      "Error creating delete request:",
      error
    );
    console.error("Error creating delete request:", error);
    res.status(500).json({ error: "Failed to create delete request" });
  }
};
const getAllDriverUsers = async (req, res) => {
  try {
    const school_id = req.user.school_id;

    const driverUsers = await User.findAll({
      where: {
        role: "driver",
        school_id,
        trash: false
      },
      attributes: ["id", "full_name", "phone","dp"],
    });
    res.status(200).json(driverUsers);
  } catch (error) {
    logger.error("Error fetching driver users:", error);
    console.error("Error fetching driver users:", error);
    res.status(500).json({ error: "Failed to fetch driver users" });
  }
}
module.exports = {
  getStudentsByClassId,
  getSpecialClassStudentsByClassId,
  getschoolIdByStudentId,
  getStudentDetailsById,
  getGuarduianIdbyStudentId,

  getClassesByYear,
  getStaffsForFilter,

  getHomeworkByStudentId,
  getHomeworkByIdAndStudentId,

  getAttendanceByStudentId,
  getStudentProfile,
  getStudentAttendanceByDate,

  allAchievements,
  achievementByStudentId,

  getInternalMarkByStudentId,

  getLeaveRequestByStudentId,

  getPaymentByStudnetId,
  getPaymentById,
  getInvoiceByStudentId,

  getLatestEvents,
  getLatestNews,
  getLatestNotices,
  getSchoolDetails,

  changePassword,
  updateFcmToken,
  updateDp,


  getAchievementsBySchool,

  accountDeleteRequests,

  getAllDriverUsers,
};
