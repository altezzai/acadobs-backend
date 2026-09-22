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
const Exams = require("../models/exams");
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
const TransportInvoice = require("../models/transport_invoice");
const Guardian = require("../models/guardian");
const Notice = require("../models/notice");
const Stop = require("../models/tracker/stop");
const Vehicle = require("../models/tracker/vehicle");
const Routes = require("../models/tracker/routes");
const Staff = require("../models/staff");
const StudentCompetencyAssessment = require("../models/assesment/student_competency_assessment");
const Competency = require("../models/assesment/competency");
const CompetencyIndicator = require("../models/assesment/competency_indicator");
const CoScholasticArea = require("../models/assesment/co_scholastic_area");
const StudentCoScholasticAssessment = require("../models/assesment/student_co_scholastic_assessment");
const Exam = require("../models/exams");
const { error } = require("winston");
const { Console } = require("winston/lib/winston/transports");
const { deleteFile } = require("../middlewares/storageUploads");
const { Class } = require("../models");
const { level } = require("winston");
const { VERSION } = require("sequelize/lib/query-types");

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
const getStudents=async(req,res)=>{
  try {
    const school_id = req.user.school_id || "";
    const searchQuery = req.query.q || "";
    const class_id = req.query.class_id || "";
    const year = req.query.year || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    let whereClause = {
      school_id,
      trash: false,
    };
    if (searchQuery) {
      whereClause.full_name = { [Op.like]: `%${searchQuery}%` };
    }
    if (class_id) {
      whereClause.class_id = class_id;
    }
 
    const {count,rows: students,} = await Student.findAndCountAll({
      where:whereClause,
      attributes: ["id", "full_name", "roll_number", "class_id", "image"],
      include: [
        {
          model: Class,
          attributes: ["id", "year", "division", "classname"],
          where: year ? { year: year } : true,
        },
        {
          model: User,
          attributes: ["id", "name", "phone"],
        },

      ],
      order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      students,
    });

  } catch (error) {
    console.error("Error fetching students:", error);
    logger.error("schoolId:", req.user.school_id, "Error in getstudents:", error);
    res.status(500).json({ error: error.message });
    
  }
}
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
  res.status(200).json({
  ...student.toJSON(),
  specialClass: specialClass || [],
});
  } catch (error) {
    console.error("Error getting student:", error);
    logger.error("userId:", req.user.user_id, "Error getting student:", error);
    res.status(500).json({ error: "Failed to get student" });
  }
};
const getStudentTransportDetails = async (req, res) => {
  try {
    const id= req.params.student_id;
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
        "one_way",
      ],
      include: [
        {
          model:Stop,
          as: "stop",
          attributes: ["id", "stop_name"],
        },
        {
          model:Routes,
           as: "routes",
          attributes: ["id", "route_name"],
          include: [
            {
              model:User,
              as: "driver",
              attributes: ["id", "name", "phone", "dp"]
            },
            {
              model:Vehicle,
              as: "vehicle",
              attributes: ["id", "vehicle_number", "type", "model", "photo"]
            },
          ]
        },
        {
          model:Routes,
           as: "dropRoute",
          attributes: ["id", "route_name"],
          include: [
            {
              model:User,
              as: "driver",
              attributes: ["id", "name", "phone", "dp"]
            },
            {
              model:Vehicle,
              as: "vehicle",
              attributes: ["id", "vehicle_number", "type", "model", "photo"]
            },
          ]
        }
      ],
    });
    if (!student) return res.status(404).json({ error: "Student not found" });
 
  res.status(200).json({
    message: "Student transport details fetched successfully",
    student,
});
  } catch (error) {
    console.error("Error getting student transport details:", error);
    logger.error("userId:", req.user.user_id, "Error getting student transport details:", error);
    res.status(500).json({ error: "Failed to get student transport details" });
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
        "type",
        "createdAt",
      ],
      include: [
        {
          model: HomeworkAssignment,
          required: true,
          where: { student_id: student_id },
          attributes: ["id", "is_seen",],
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
          attributes: ["id", "remarks", "points", "solved_file", "is_seen"],
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
      order: [["createdAt", "DESC"]],
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
const getAchievementById = async (req, res) => {
  try {
    const id = req.params.id;
    const school_id = req.user.school_id;
    const achievement = await Achievement.findOne({
      where: { id, school_id, trash: false },
      attributes: ["id", "title", "description", "category", "level", "date"],
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
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
    });
    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }
    res.status(200).json(achievement);
  } catch (error) {
    logger.error("userId:", req.user.user_id, "getAchievementById :", error);
    res.status(500).json({ error: "Internal server error" });
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
    let whereClause = {
      trash: false,
      school_id: school_id,
      exam_id: null,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: Mark } = await Marks.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { student_id: student_id },
      include: [
        {
          model: InternalMark,
          where: whereClause,
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
const getTermExamByStudentId = async (req, res) => {
  try {
    const { student_id } = req.params;
    const school_id = req.user.school_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const exam_id = req.query.exam_id || null;
    const offset = (page - 1) * limit;
    let whereClause = {
      trash: false,
      school_id: school_id,
      exam_id: { [Op.ne]: null },
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (exam_id) {
      whereClause.exam_id = exam_id;
    }
    const { count, rows: Mark } = await Marks.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { student_id: student_id },
      include: [
        {
          model: InternalMark,
          where: whereClause,
          include: [
            {
              model: Subject,
              attributes: ["id", "subject_name"],
            },
            {
              model: Exams,
              required:true,
              attributes: ["id", "exam_name"],
              where: { trash: false, publish: true },
            },
            {
              model: User,
              attributes: ["id", "name"],
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
    const payment_category = req.query.payment_category || "";
    const payment_status = req.query.payment_status || "";
    let whereClause = {
      student_id: student_id,
      school_id: school_id,
      trash: false
    };
    
    if(payment_category){
      whereClause.payment_category = payment_category
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
        {
          model:InvoiceStudent,
          required:false,
          attributes:["id"],
          include:[
            {
              model:Invoice,
              attributes:["title","amount"]
            }
          ]
        },
        {
          model:TransportInvoice,
          required:false,
          attributes:["id","amount","term","due_date"],
          include:[
            {
              model:Stop,
              attributes:["stop_name","charge"]
            }
          ]
        }
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
  const getTransportInvoiceByStudentId  = async (req, res) => {
   try{
    const student_id = req.params.id;
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
      whereClause.term ={[Op.like]:`%${searchQuery}%`};
    }
    const { count, rows: transportInvoices } = await TransportInvoice.findAndCountAll({
      where: { student_id: student_id },
      include: [
        {
          model: Stop,     
          attributes: ["id", "stop_name"],
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
      data:transportInvoices,
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
      where: { school_id: school_id,trash:false },
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
        trash:false,
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
          attributes: ["id","name"],
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
        attributes: ["id", "classname","year"],
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


const getAllDriverUsers = async (req, res) => {
  try {
    const school_id = req.user.school_id;

    const driverUsers = await User.findAll({
      where: {
        role: "driver",
        school_id,
        trash: false
      },
      attributes: ["id", "name", "phone","dp"],
    });
    res.status(200).json(driverUsers);
  } catch (error) {
    logger.error("Error fetching driver users:", error);
    console.error("Error fetching driver users:", error);
    res.status(500).json({ error: "Failed to fetch driver users" });
  }
}
const getMyProfileAndSchoolDetails = async (req, res) => {
  try{
    const userId = req.user.user_id;
    const school_id = req.user.school_id;
    const user = await User.findOne({
      where: { id: userId },
      attributes: ["id", "name", "email", "phone", "dp", "role"],
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const school = await School.findOne({
      where: { id: school_id },
      attributes: ["id", "name","logo","bg_image","primary_colour", "secondary_colour"],
    })
    res.status(200).json({ user, school });
  }catch(error){
    logger.error("userId:", req.user.user_id, "Error fetching profile details:", error);
    console.error("Error fetching profile details:", error);
    res.status(500).json({ error: "Failed to fetch profile details" });
  }
}
const getCompetencyAssesmentByStudentId= async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const student_id = req.params.student_id ;
    const exam_id = req.query.exam_id||null;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    let whereClause = {
      school_id,
      student_id,
    };
    if (exam_id) {
      whereClause.exam_id = exam_id;
    }
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const {count,rows:assessments}  = await StudentCompetencyAssessment.findAndCountAll({
      where:whereClause,
      limit,
      offset,
      distinct:true,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Competency,
          attributes: ["id", "title", "description", "display_order", "status"],
        },
        {
          model: CompetencyIndicator,
          attributes: [
            "id",
            "competency_id",
            "title",
            "display_order",
            "status",
          ],
        },
        {
          model: Student,
          attributes: [
            "id",
            "full_name",
            "roll_number",
          ],
        },
        {
          model: Exam,
          attributes: ["id", "exam_name", "education_year"],
        },
      ],
      order: [
        [Competency, "display_order", "ASC"],
        [CompetencyIndicator, "display_order", "ASC"],
        ["id", "ASC"],
      ],
    });


    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      data: assessments,
    });
  } catch (error) {
    logger.error("school_id:", req.user?.school_id, "Error fetching all students:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all students",
      error: error.message,
    });
  }
  }

const getExamTitles = async (req, res) => {
  try{
  const titiles =[
    "PT",
    "Term",
    "Internal",
    "Model",
  ]
  res.status(200).json(titiles)
  }catch(error){
    logger.error("userId:", req.user.user_id, "Error fetching profile details:", error);
    console.error("Error fetching profile details:", error);
    res.status(500).json({ error: "Failed to fetch profile details" });
  }

}
const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = [
      "sick", "casual", "emergency", "vacation", "onduty","c-off","other"
    ]
    res.status(200).json(leaveTypes);
  } catch (error) {
    logger.error("Error fetching leave types:", error);
    console.error("Error fetching leave types:", error);
    res.status(500).json({ error: "Failed to fetch leave types" });
  }
}
const getTermTypeForTransportationInvoice = async (req, res) => {
  try {
    const school_id = req.user.school_id;
  
    let termTypeForTransportationInvoice = [
      "Term1", "Term2", "Term3"
    ]
    res.status(200).json(termTypeForTransportationInvoice);
  } catch (error) {
    logger.error("Error fetching term type for transportation invoice:", error);
    console.error("Error fetching term type for transportation invoice:", error);
    res.status(500).json({ error: "Failed to fetch term type for transportation invoice" });
  }
}
const getClassRangeForSubject = async (req, res) => {
  try{
    const school_id = req.user.school_id;
    //set an array value and label
  let range = [
    {
    label: "LKG-2 (FS)",
    key:"FS"
    },
    {
      label:"3-5 (PS)",
      key:"PS"
    },
    {
      label:"6-8 (MS)",
      key:"MS"
    },
    {
      label:"9-12 (SS)",
      key:"SS"
    },
    {
      label:"common",
      key:"common"
    },
    {
      label:"other",
      key:"other"
    }
  ]
    res.status(200).json({range});
  }catch(error){
    logger.error("Error fetching class range for subject:", error);
    console.error("Error fetching class range for subject:", error);
    res.status(500).json({ error: "Failed to fetch class range for subject" });
  }
};

const getCoScholasticAssessmentByStudentId = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const student_id = req.params.student_id;
    const exam_id = req.query.exam_id || null;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = (page - 1) * limit;

    let whereClause = {
      school_id,
      student_id,
    };

    if (exam_id) {
      whereClause.exam_id = exam_id;
    }

    const { count, rows: assessments } =
      await StudentCoScholasticAssessment.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        distinct: true,
        include: [
          {
            model: CoScholasticArea,
            attributes: [
              "id",
              "name",
              "class_group",
              "display_order",
              "status",
            ],
            where: searchQuery
              ? {
                  name: { [Op.like]: `%${searchQuery}%` },
                }
              : undefined,
          },
          {
            model: Student,
            attributes: ["id", "full_name", "roll_number"],
          },
          {
            model: Exam,
            attributes: ["id", "exam_name", "education_year"],
          },
          {
            model: User,
            as: "Recorder",
            attributes: ["id", "full_name", "email"],
          },
        ],
        order: [
          [CoScholasticArea, "display_order", "ASC"],
          ["id", "ASC"],
        ],
      });

    const totalPages = Math.ceil(count / limit);
    return res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      data: assessments,
    });
  } catch (error) {
    logger.error(
      "school_id:",
      req.user?.school_id,
      "Error fetching co-scholastic assessments by student id:",
      error
    );
    return res.status(500).json({
      success: false,
      error: "Failed to fetch co-scholastic assessments",
      details: error.message,
    });
  }
};

module.exports = {
  getStudentsByClassId,
  getSpecialClassStudentsByClassId,
  getStudents,
  getschoolIdByStudentId,
  getStudentDetailsById,
  getStudentTransportDetails,
  getGuarduianIdbyStudentId,

  getClassesByYear,
  getStaffsForFilter,

  getHomeworkByStudentId,
  getHomeworkByIdAndStudentId,

  getAttendanceByStudentId,
  getStudentProfile,
  getStudentAttendanceByDate,

  getAchievementsBySchool,
  achievementByStudentId,
  getAchievementById,

  getInternalMarkByStudentId,
  getTermExamByStudentId,

  getLeaveRequestByStudentId,

  getPaymentByStudnetId,
  getPaymentById,
  getInvoiceByStudentId,
  getTransportInvoiceByStudentId,

  getLatestEvents,
  getLatestNews,
  getLatestNotices,
  getSchoolDetails,

  changePassword,
  updateFcmToken,
  updateDp,

  accountDeleteRequests,

  getAllDriverUsers,

  getMyProfileAndSchoolDetails,
  getCompetencyAssesmentByStudentId,
  getCoScholasticAssessmentByStudentId,
  getLeaveTypes,
  getExamTitles,
  getTermTypeForTransportationInvoice,
  getClassRangeForSubject,
};
