const { Op } = require("sequelize");
const moment = require("moment");
const {
  compressAndSaveFile,
  compressAndSaveMultiFile,
  deletefilewithfoldername,
} = require("../utils/fileHandler");
const Mark = require("../models/marks");
const InternalMark = require("../models/internal_marks");
const School = require("../models/school");
const Class = require("../models/class");
const Subject = require("../models/subject");
const Student = require("../models/student");
const Attendance = require("../models/attendance");
const AttendanceMarked = require("../models/attendancemarked");
const DutyAssignment = require("../models/dutyassignment");
const Duty = require("../models/duty");
const User = require("../models/user");
const Achievement = require("../models/achievement");
const StudentAchievement = require("../models/studentachievement");
const LeaveRequest = require("../models/leaverequest");
const Notice = require("../models/notice");
const ParentNote = require("../models/parent_note");
const Timetable = require("../models/timetables");
const TimetableSubstitution = require("../models/timetable_substitutions");
const Staff = require("../models/staff");

const { Homework, HomeworkAssignment } = require("../models");
const { getGuarduianIdbyStudentId } = require("./commonController");
const {
  sendMessageWithParentNote,
} = require("../socketHandlers/messageHandlers");

const createExamWithMarks = async (req, res) => {
  try {
    const school_id = req.user.school_id || "";
    const {
      class_id,
      subject_id,
      internal_name,
      max_marks,
      date,
      recorded_by,
      marks,
    } = req.body;
    if (!school_id || !class_id || !subject_id || !internal_name || !date) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }
    const existingInternal = await InternalMark.findOne({
      where: {
        school_id,
        class_id,
        subject_id,
        internal_name,
        date,
      },
    });
    if (existingInternal) {
      return res.status(400).json({ error: "Internal mark already exists" });
    }
    const internal = await InternalMark.create({
      school_id,
      class_id,
      subject_id,
      internal_name,
      max_marks,
      date,
      recorded_by,
    });

    const marksData = marks.map((m) => ({
      internal_id: internal.id,
      student_id: m.student_id,
      marks_obtained: m.marks_obtained,
      status: m.status,
    }));

    await Mark.bulkCreate(marksData);

    res
      .status(201)
      .json({ message: "Internal internal and marks created", internal });
  } catch (error) {
    console.error("Error creating internal mark and marks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getInternalMarksById = async (req, res) => {
  try {
    const { id } = req.params;
    const internal = await InternalMark.findOne({
      where: { id },
      include: [
        {
          model: Mark,
          attributes: ["id", "marks_obtained", "status"],
          include: [
            { model: Student, attributes: ["id", "full_name", "roll_number"] },
          ],
        },
        { model: School, attributes: ["id", "name"] },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
      ],
    });
    if (!internal) {
      return res.status(404).json({ error: "Internal mark not found" });
    }
    res.status(200).json(internal);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
const getAllmarks = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: marks } = await InternalMark.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        trash: false,
        [Op.or]: [
          { internal_name: { [Op.like]: `%${searchQuery}%` } },
          { date: { [Op.like]: `%${searchQuery}%` } },
        ],
      },
      include: [
        { model: School, attributes: ["id", "name"] },
        { model: Class, attributes: ["id", "year", "division", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      marks,
    });
    // res.status(200).json(marks);
  } catch (err) {
    console.error("Error fetching marks:", err);
    res.status(500).json({ error: "Failed to fetch marks" });
  }
};

const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await InternalMark.update(req.body, {
      where: { id: id },
    });
    res.status(200).json({ message: "Exam detail updated", updated });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

const updateMark = async (req, res) => {
  try {
    const { mark_id } = req.params;
    const updated = await Mark.update(req.body, {
      where: { id: mark_id },
    });
    res.status(200).json({ message: "mark updated", updated });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    await InternalMark.update({ trash: true }, { where: { id: id } });
    res.status(200).json({ message: "Exam soft-deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};
//update bulk marks
const bulkUpdateMarks = async (req, res) => {
  try {
    const { internal_id, marks } = req.body;

    if (!internal_id || !Array.isArray(marks)) {
      return res
        .status(400)
        .json({ error: "internal_id and marks array are required" });
    }

    const updatePromises = marks.map(async (item) => {
      return Mark.update(
        {
          marks_obtained: item.marks_obtained,
          status: item.status,
        },
        {
          where: {
            internal_id,
            student_id: item.student_id,
          },
        }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({ message: "Marks updated successfully" });
  } catch (error) {
    console.error("Bulk update failed:", error);
    res.status(500).json({ error: "Bulk update failed" });
  }
};
const getInternalMarkByRecordedBy = async (req, res) => {
  try {
    const { recorded_by } = req.query;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: exams } = await InternalMark.findAndCountAll({
      offset,
      distinct: true,
      limit,

      where: {
        recorded_by,
        trash: false,
        [Op.or]: [
          { internal_name: { [Op.like]: `%${searchQuery}%` } },
          { date: { [Op.like]: `%${searchQuery}%` } },
        ],
      },
      attributes: ["id", "internal_name", "max_marks", "date"],
      include: [
        { model: School, attributes: ["id", "name"] },
        { model: Class, attributes: ["id", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      exams,
    });
  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).json({ error: "Failed to fetch exams" });
  }
};

const createHomeworkWithAssignments = async (req, res) => {
  try {
    const school_id = req.user.school_id || "";
    const {
      teacher_id,
      class_id,
      subject_id,
      description,
      due_date,
      title,
      type,
      assignments,
    } = req.body;

    if (
      !school_id ||
      !teacher_id ||
      !class_id ||
      !subject_id ||
      !title ||
      !due_date
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/homeworks/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    // Check for existing homework with matching criteria
    const existingHomework = await Homework.findOne({
      where: {
        school_id: 1,
        teacher_id,
        class_id,
        subject_id,
        due_date,
        title,
      },
    });

    if (existingHomework) {
      return res.status(200).json({
        message: "Homework already exists",
        homework: existingHomework,
      });
    }

    const homework = await Homework.create({
      school_id,
      teacher_id,
      class_id,
      subject_id,
      description,
      due_date,
      title,
      type,
      file: fileName ? fileName : null,
    });

    const assignmentData = assignments.map((a) => ({
      ...a,
      homework_id: homework.id,
    }));

    await HomeworkAssignment.bulkCreate(assignmentData);

    res.status(201).json({
      message: "Homework and assignments created",
      homework,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
const getAllHomework = async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: homework } = await Homework.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        description: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },
      include: [
        {
          model: HomeworkAssignment,
          attributes: ["id", "remarks", "points", "solved_file"],

          include: [
            {
              model: Student,
              attributes: ["id", "reg_no", "full_name", "image"],
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
      homework,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
const getHomeworkById = async (req, res) => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id, {
      include: [
        {
          model: HomeworkAssignment,
          attributes: ["id", "remarks", "points", "solved_file"],

          include: [
            {
              model: Student,
              attributes: ["id", "reg_no", "full_name", "image", "roll_number"],
            },
          ],
        },
      ],
    });
    if (!homework) return res.status(404).json({ error: "Not found" });
    res.status(200).json(homework);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
const updateHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date } = req.body;

    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/homeworks/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    const homework = await Homework.findByPk(id);
    if (!homework) return res.status(404).json({ error: "Not found" });
    const existingHomework = await Homework.findOne({
      where: {
        id: { [Op.ne]: id },
        school_id: homework.school_id,
        teacher_id: homework.teacher_id,
        class_id: homework.class_id,
        subject_id: homework.subject_id,
        title,
        due_date,
        trash: false,
      },
    });
    if (existingHomework) {
      return res.status(200).json({
        message: "Homework already exists in the same class",
        homework: existingHomework,
      });
    }

    await homework.update({
      title,
      description,
      due_date,
      file: fileName ? fileName : homework.file,
    });
    res.status(200).json({ message: "Updated successfully d", homework });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updateHomeworkAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks, points } = req.body;

    const assignment = await HomeworkAssignment.findByPk(id);
    if (!assignment) return res.status(404).json({ error: "Not found" });
    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/solved_homeworks/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    await assignment.update({
      remarks,
      points,
      solved_file: fileName ? fileName : assignment.solved_file,
    });
    res.status(200).json({ message: "Updated successfully", assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
const deleteHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id);
    if (!homework || homework.trash)
      return res.status(404).json({ error: "Not found" });

    await Homework.update({ trash: true }, { where: { id: id } });
    res.status(200).json({
      message: `Deleted successfully,'description : ${homework.description}'.`,
    });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};
const permanentDeleteHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id);
    if (!homework || homework.trash)
      return res.status(404).json({ error: "Not found" });

    if (!homework) return res.status(404).json({ error: "Not found" });

    await HomeworkAssignment.destroy({ where: { homework_id: id } });
    await homework.destroy();

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const restoreHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id);
    if (!homework) return res.status(404).json({ error: "Not found" });

    await Homework.update({ trash: false }, { where: { id: id } });

    res.json({
      message: `restored 'description : ${homework.description}'`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const bulkUpdateHomeworkAssignments = async (req, res) => {
  try {
    const { homework_id, assignments } = req.body;

    if (!homework_id || !Array.isArray(assignments)) {
      return res
        .status(400)
        .json({ error: "homework_id and assignments array are required" });
    }

    const updatePromises = assignments.map(async (item) => {
      return HomeworkAssignment.update(
        {
          remarks: item.remarks,
          points: item.points,
        },
        {
          where: {
            homework_id,
            student_id: item.student_id,
          },
        }
      );
    });

    await Promise.all(updatePromises);

    res
      .status(200)
      .json({ message: "Homework assignments updated successfully" });
  } catch (error) {
    console.error("Bulk update failed:", error);
    res.status(500).json({ error: "Bulk update failed" });
  }
};
const getHomeworkAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await HomeworkAssignment.findByPk(id, {
      include: [
        {
          model: Student,
          attributes: ["id", "reg_no", "full_name", "image"],
        },
      ],
    });
    if (!assignment) return res.status(404).json({ error: "Not found" });
    res.status(200).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getHomeworkByTeacher = async (req, res) => {
  try {
    const teacher_id = req.user.user_id;
    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: homework } = await Homework.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: {
        teacher_id,
        title: { [Op.like]: `%${searchQuery}%` },
        trash: false,
      },
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      homework,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const createAttendance = async (req, res) => {
  try {
    const school_id = req.user.school_id || "";
    const { teacher_id, class_id, subject_id, period, date, students } =
      req.body;

    if (
      !teacher_id ||
      !school_id ||
      !class_id ||
      !period ||
      !date ||
      !students ||
      !Array.isArray(students)
    ) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }

    // Get all students on approved leave for the date
    const leaveStudents = await LeaveRequest.findAll({
      where: {
        school_id,
        role: "student",
        status: "approved",
        from_date: { [Op.lte]: date },
        to_date: { [Op.gte]: date },
        trash: false,
      },
      attributes: ["student_id"],
    });

    const leaveStudentIds = leaveStudents.map((leave) => leave.student_id);

    // Filter out students on leave
    const filteredStudents = students.filter(
      (student) => !leaveStudentIds.includes(student.student_id)
    );

    console.log("Filtered Students:", filteredStudents);
    let attendance;

    const existingAttendance = await Attendance.findOne({
      where: {
        school_id,
        class_id,
        period,
        date,
      },
    });

    if (existingAttendance) {
      await existingAttendance.update({
        teacher_id,
        subject_id,
      });
      attendance = existingAttendance;
    } else {
      // Create new attendance
      attendance = await Attendance.create({
        teacher_id,
        school_id,
        class_id,
        subject_id,
        period,
        date,
      });
    }
    const records = filteredStudents.map((student) => ({
      attendance_id: attendance.id,
      student_id: student.student_id,
      status: student.status,
      remarks: student.remarks || null,
    }));

    await AttendanceMarked.bulkCreate(records);

    res.status(201).json({
      message: existingAttendance ? "Attendance updated" : "Attendance created",
      attendance_id: attendance.id,
      inserted_count: records.length,
    });
  } catch (err) {
    console.error("Create Attendance Error:", err);
    res.status(500).json({ error: "Failed to create/update attendance" });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
    };

    if (date) {
      whereClause.date = date;
    }

    const { count, rows: attendance } = await Attendance.findAndCountAll({
      offset,
      distinct: true,
      limit,

      where: whereClause,
      include: [
        {
          model: AttendanceMarked,
          attributes: ["id", "status", "remarks"],
          include: [
            { model: Student, attributes: ["id", "full_name", "image"] },
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findOne({
      where: { id, trash: false },
      include: [
        {
          model: AttendanceMarked,
          separate: true, // Important for ordering nested include
          order: [[{ model: Student }, "roll_number", "ASC"]],
          attributes: ["id", "status", "remarks"],
          include: [
            {
              model: Student,
              attributes: ["id", "full_name", "image", "roll_number"],
            },
          ],
        },
        {
          model: Class,
          attributes: ["id", "classname"],
        },
        {
          model: Subject,
          attributes: ["id", "subject_name"],
        },
      ],
    });

    if (!attendance) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const school_id = req.user.school_id || "";
    const { subject_id, period, date } = req.body;

    const attendance = await Attendance.findOne({
      where: { id, trash: false },
    });
    const existingAttendance = await Attendance.findOne({
      where: {
        school_id,
        class_id: attendance.class_id,
        period,
        date,
      },
    });
    if (existingAttendance && existingAttendance.id != id) {
      return res.status(400).json({ error: "Attendance already exists" });
    }

    if (!attendance) return res.status(404).json({ error: "Not found" });
    await Attendance.update({ subject_id, period, date }, { where: { id } });
    res.json({ message: "Updated", attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const updateAttendanceMarkedById = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    await AttendanceMarked.update({ status, remarks }, { where: { id } });
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Bulk update attendance marked
const bulkUpdateAttendanceById = async (req, res) => {
  try {
    const { attendance_id } = req.params;
    const { data } = req.body;
    if (!attendance_id || !Array.isArray(data)) {
      return res
        .status(400)
        .json({ error: "attendance_id and data array are required" });
    }

    const updatePromises = data.map(async (item) => {
      return AttendanceMarked.update(
        {
          status: item.status,
          remarks: item.remarks,
        },
        {
          where: {
            id: item.id,
            attendance_id: attendance_id,
          },
        }
      );
    });

    await Promise.all(updatePromises);
    console.log("updatePromises:", updatePromises);

    res.status(200).json({ message: "Attendance marked updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAttendanceByclassIdAndDate = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const class_id = req.query.class_id;
    const period = req.query.period || 1;
    const date = req.query.date || moment().format("YYYY-MM-DD");
    if (!school_id || !class_id || !date || !period) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const attendance = await Attendance.findOne({
      where: { school_id, class_id, date, period },
      attributes: [
        "id",
        "period",
        "date",
        "class_id",
        "subject_id",
        "teacher_id",
        "trash",
      ],
      include: [
        {
          model: User,
          attributes: ["id", "name", "role"],
        },
        {
          model: Subject,
          attributes: ["id", "subject_name"],
        },
        {
          model: AttendanceMarked,
          separate: true,
          attributes: ["id", "student_id", "status", "remarks"],
          // order: [[{ model: Student }, "roll_number", "ASC"]],
        },
      ],
    });

    if (attendance && attendance.teacher_id) {
      res.json({ status: "recorded", attendance, trash: attendance.trash });
    } else {
      const students = await Student.findAll({
        where: { class_id, school_id, trash: false },
        attributes: ["id", "full_name", "roll_number"],
        order: [["roll_number", "ASC"]],
        include: [
          {
            model: AttendanceMarked,
            where: { attendance_id: attendance ? attendance.id : 0 },
            attributes: ["id", "status"],
            required: false,
          },
        ], // Order by roll_number
      });
      res.json({
        status: "not_recorded",
        students,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllClassesAttendanceStatus = async (req, res) => {
  try {
    const school_id = req.user.school_id || "";
    const date = req.query.date || moment().format("YYYY-MM-DD");
    const attendanceData = await Attendance.findAll({
      where: { school_id, date: date, trash: false },
      attributes: ["id", "period", "date", "class_id", "subject_id"],
      include: [
        {
          model: AttendanceMarked,
          attributes: ["id", "status", "remarks"],
          include: [{ model: Student, attributes: ["id", "full_name"] }],
        },
        { model: Class, attributes: ["id", "classname"] },
        { model: Subject, attributes: ["id", "subject_name"] },
      ],
    });

    if (!attendanceData || attendanceData.length === 0) {
      return res
        .status(404)
        .json({ error: "No attendance found for this date" });
    }

    // Grouping by class_id and then period
    const grouped = {};

    attendanceData.forEach((att) => {
      const classId = att.class_id;
      const className = att.Class?.classname;
      const subjectName = att.Subject?.subject_name;
      const period = att.period;

      if (!grouped[classId]) {
        grouped[classId] = {
          class_id: classId,
          class_name: className,
          date: att.date,
          periods: {},
        };
      }

      if (!grouped[classId].periods[period]) {
        grouped[classId].periods[period] = {
          subject: subjectName,
          total_present: 0,
          total_absent: 0,
          total_leave: 0,
          total_late: 0,
          total_students: 0,

          // attendance_records: [],
        };
      }

      const currentPeriod = grouped[classId].periods[period];

      att.AttendanceMarkeds.forEach((mark) => {
        if (mark.status === "present") currentPeriod.total_present += 1;
        if (mark.status === "absent") currentPeriod.total_absent += 1;
        if (mark.status === "leave") currentPeriod.total_leave += 1;
        if (mark.status === "late") currentPeriod.total_late += 1;
        currentPeriod.total_students += 1;
      });
    });

    res.json({ status: "checked", attendance: Object.values(grouped) });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: err.message });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findByPk(id);
    if (!attendance || attendance.trash)
      return res.status(404).json({ error: "Not found" });

    await Attendance.update({ trash: true }, { where: { id: id } });
    res.status(200).json({
      message: `Deleted successfully.`,
    });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};

const restoreAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findByPk(id);
    if (!attendance) return res.status(404).json({ error: "Not found" });

    await Attendance.update({ trash: false }, { where: { id: id } });

    res.json({
      message: `restored successfully.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
//get trashed attendance

const permanentDeleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    await AttendanceMarked.destroy({ where: { attendance_id: id } });
    await Attendance.destroy({ where: { id } });
    res.json({ message: "Peremently Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getTrashedAttendanceByTeacher = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const teacher_id = req.query.teacher_id || "";
    const whereClause = {
      trash: true,
    };
    if (teacher_id) {
      whereClause.teacher_id = teacher_id;
    }

    const { count, rows: attendance } = await Attendance.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Class,
          attributes: ["id", "classname"],
        },
        {
          model: Subject,
          attributes: ["id", "subject_name"],
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getAttendanceByTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const date = req.query.date || "";
    const whereClause = {
      trash: false,
      teacher_id,
    };
    if (date) {
      whereClause.date = date;
    }

    const { count, rows: attendance } = await Attendance.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      attributes: ["id", "period", "date"],
      include: [
        {
          model: Class,
          attributes: ["id", "classname"],
        },
        {
          model: Subject,
          attributes: ["id", "subject_name"],
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getAllDuties = async (req, res) => {
  try {
    const staff_id = req.query.staff_id;
    const searchQuery = req.query.q || "";
    const deadline = req.query.deadline || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
    };

    if (deadline) {
      whereClause.deadline = deadline;
    }
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: duties } = await DutyAssignment.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: { staff_id },
      attributes: ["id", "remarks", "status", "solved_file"],
      include: [
        {
          model: Duty,
          where: whereClause,
          attributes: [
            "id",
            "title",
            "description",
            "deadline",
            "file",
            "start_date",
          ],
        },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      duties,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch duties" });
  }
};
const getAssignedDutyById = async (req, res) => {
  try {
    const id = req.params.id;
    const staff_id = req.query.staff_id;
    const duty = await DutyAssignment.findOne({
      where: { id, staff_id },
      attributes: ["id", "remarks", "status", "solved_file"],
      include: [
        {
          model: Duty,

          attributes: [
            "id",
            "title",
            "description",
            "deadline",
            "file",
            "start_date",
          ],
        },
      ],
    });

    if (!duty) {
      return res.status(404).json({ error: "Duty not found" });
    }

    res.json(duty);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch duty" });
  }
};
const updateAssignedDuty = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks, status, staff_id } = req.body;
    const assignedDuty = await DutyAssignment.findOne({
      where: {
        id,
        staff_id,
      },
    });
    if (!assignedDuty) {
      return res.status(404).json({ error: "Not found" });
    }
    let fileName = null;
    if (req.file) {
      uploadPath = "uploads/solved_duties/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    const updatedDuty = await assignedDuty.update({
      status,
      remarks,
      solved_file: fileName ? fileName : assignedDuty.solved_file,
    });
    res.json({ message: "Updated", updatedDuty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const createAchievementWithStudents = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;
    const { title, description, category, date, awarding_body, students } =
      req.body;
    if (
      students === undefined ||
      students.length === 0 ||
      students[0].student_id === undefined
    ) {
      return res
        .status(400)
        .json({ error: "At least one student id is required" });
    }

    let parsedStudents;
    if (typeof students === "string") {
      parsedStudents = JSON.parse(students);
    } else {
      parsedStudents = students;
    }
    const existingAchievement = await Achievement.findOne({
      where: {
        school_id,
        title,
        date,
        recorded_by,
      },
    });

    if (existingAchievement) {
      return res
        .status(400)
        .json({ error: "An achievement with the same title already exists" });
    }
    const achievement = await Achievement.create({
      school_id,
      title,
      description,
      category,
      level: "class",
      date,
      awarding_body,
      recorded_by,
    });

    const uploadPath = "uploads/achievement_proofs/";

    // Handle and compress each student's file
    const studentAchievements = await Promise.all(
      parsedStudents.map(async (student, index) => {
        let compressedFileName = null;

        if (req.files && req.files[index]) {
          compressedFileName = await compressAndSaveMultiFile(
            req.files[index],
            uploadPath
          );
        }

        return {
          achievement_id: achievement.id,
          student_id: student.student_id,
          status: student.status,
          proof_document: compressedFileName,
          remarks: student.remarks,
        };
      })
    );

    await StudentAchievement.bulkCreate(studentAchievements);

    res.status(201).json({
      message: "Achievement with students saved successfully",
      achievement,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
const getAllAchievementsByStaffId = async (req, res) => {
  try {
    const staffId = req.user.user_id;

    const searchQuery = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      recorded_by: staffId,
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
      where: whereClause,
      attributes: ["id", "title", "description", "category", "level", "date"],

      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      achievements,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAchievementById = async (req, res) => {
  try {
    const achievement = await Achievement.findByPk(req.params.id, {
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
      ],
    });
    res.status(200).json(achievement);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateAchievement = async (req, res) => {
  try {
    const id = req.params.id;
    const recorded_by = req.user.user_id;
    const achievement = await Achievement.findOne({
      where: { id, recorded_by },
      attributes: ["id", "title", "description", "category", "level", "date"],
    });

    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }
    const { title, description, category, level, date, awarding_body } =
      req.body;

    await achievement.update({
      title,
      description,
      category,
      level,
      date,
      awarding_body,
    });
    res
      .status(200)
      .json({ message: "Achievement updated successfully", achievement });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const deleteAchievement = async (req, res) => {
  try {
    await Achievement.update({ trash: true }, { where: { id: req.params.id } });
    res.status(200).json({ message: "Achievement trashed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
const restoreAchievement = async (req, res) => {
  try {
    await Achievement.update(
      { trash: false },
      { where: { id: req.params.id } }
    );
    res.status(200).json({ message: "Achievement restored successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
const updateStudentAchievement = async (req, res) => {
  try {
    const recorded_by = req.user.user_id;

    const { status, proof_document, remarks } = req.body;
    if (
      status !== "1st prize" &&
      status !== "2nd prize" &&
      status !== "3rd prize" &&
      status !== "participant" &&
      status !== "other"
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const StudentAchievementData = await StudentAchievement.findOne({
      where: { id: req.params.id },
      attributes: ["id", "status", "proof_document", "remarks"],
      include: [
        {
          model: Achievement,
          where: { recorded_by },
          attributes: ["id", "title"],
        },
      ],
    });
    if (!StudentAchievementData) {
      return res.status(404).json({ error: "Student achievement not found" });
    }

    let AchievementFilename = StudentAchievementData.proof_document;
    const uploadPath = "uploads/achievement_proofs/";
    if (req.file) {
      await deletefilewithfoldername(AchievementFilename, uploadPath);
      AchievementFilename = await compressAndSaveFile(req.file, uploadPath);
    }
    await StudentAchievementData.update({
      status,
      proof_document,
      remarks,
      proof_document: AchievementFilename ? AchievementFilename : null,
    });
    res.status(200).json({
      message: "Student achievement updated successfully",
      StudentAchievementData,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
const createLeaveRequest = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const user_id = req.user.user_id;
    const { from_date, to_date, leave_type, reason, leave_duration } = req.body;
    if (!from_date || !to_date || !leave_type || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const existingRequest = await LeaveRequest.findOne({
      where: {
        school_id: school_id,
        user_id: user_id,
        from_date: from_date,
        to_date: to_date,
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already exists" });
    }

    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/leave_requests/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    const data = await LeaveRequest.create({
      school_id: school_id,
      user_id: user_id,
      role: "staff",
      from_date: from_date,
      to_date: to_date,
      leave_type: leave_type,
      reason: reason,
      attachment: fileName ? fileName : null,
      leave_duration,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({ error: "Failed to create leave request" });
  }
};

const getAllLeaveRequests = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    if (!user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
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
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};

const getLeaveRequestById = async (req, res) => {
  try {
    const Id = req.params.id;
    const user_id = req.user.user_id;
    if (!user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const data = await LeaveRequest.findOne({
      where: {
        id: Id,
        user_id,
        trash: false,
      },
    });
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error) {
    console.error("Fetch One Error:", error);
    res.status(500).json({ error: "Failed to fetch leave request" });
  }
};

const updateLeaveRequest = async (req, res) => {
  try {
    const Id = req.params.id;
    const school_id = req.user.school_id || "";
    const { user_id, from_date, to_date, leave_type, reason, leave_duration } =
      req.body;

    const data = await LeaveRequest.findByPk(Id);
    if (!data) return res.status(404).json({ error: "Not found" });
    const existingRequest = await LeaveRequest.findOne({
      where: {
        school_id: school_id,
        user_id: user_id,
        from_date: from_date,
        to_date: to_date,
        id: { [Op.ne]: Id },
      },
    });
    if (existingRequest) {
      return res.status(400).json({ error: "Leave request already exists" });
    }
    let fileName = data.attachment;
    if (req.file) {
      const uploadPath = "uploads/leave_requests/";
      await deletefilewithfoldername(fileName, uploadPath);
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }
    await data.update({
      from_date: from_date,
      to_date: to_date,
      leave_type: leave_type,
      reason: reason,
      attachment: fileName ? fileName : null,
      leave_duration,
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Failed to update leave request" });
  }
};

const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const leave = await LeaveRequest.findOne({
      where: {
        id: id,
        user_id: user_id,
        trash: false,
      },
    });
    if (!leave) return res.status(404).json({ error: "Not found" });

    await leave.update({ trash: true });
    res.status(200).json("Successfully deleted");
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Failed to delete leave request" });
  }
};
const restoreLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    const leave = await LeaveRequest.findOne({
      where: { id: id, trash: true, user_id: user_id },
    });
    if (!leave) return res.status(404).json({ error: "Not found" });

    await leave.update({ trash: false });
    res.status(200).json("Successfully restored");
  } catch (error) {
    console.error("Restore Error:", error);
    res.status(500).json({ error: "Failed to restore leave request" });
  }
};
// const createStudentLeaveRequest = async (req, res) => {
//   try {
//     const school_id = req.user.school_id || "";
//     const {

//       user_id,
//       student_id,
//       from_date,
//       to_date,
//       leave_type,
//       reason,
//       leave_duration,
//     } = req.body;
//     if (
//       !school_id ||
//       !user_id ||
//       !student_id ||
//       !from_date ||
//       !to_date ||
//       !leave_type ||
//       !reason
//     ) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }
//     const existingRequest = await LeaveRequest.findOne({
//       where: {
//         school_id: school_id,
//         user_id: user_id,
//         student_id: student_id,
//         from_date: from_date,
//         to_date: to_date,
//       },
//     });

//     if (existingRequest) {
//       return res.status(400).json({ error: "Leave request already exists" });
//     }

//     let fileName = null;
//     if (req.file) {
//       const uploadPath = "uploads/leave_requests/";
//       fileName = await compressAndSaveFile(req.file, uploadPath);
//     }
//     const data = await LeaveRequest.create({
//       school_id: school_id,
//       user_id: user_id,
//       student_id: student_id,
//       role: "student",
//       from_date: from_date,
//       to_date: to_date,
//       leave_type: leave_type,
//       reason: reason,
//       attachment: fileName ? fileName : null,
//       leave_duration,
//     });
//     res.status(201).json(data);
//   } catch (error) {
//     console.error("Create Error:", error);
//     res.status(500).json({ error: "Failed to create leave request" });
//   }
// };
// const updateStudentLeaveRequest = async (req, res) => {
//   try {
//     const Id = req.params.id;
//     const {
//       school_id,
//       user_id,
//       student_id,
//       from_date,
//       to_date,
//       leave_type,
//       reason,
//       leave_duration,
//     } = req.body;

//     const data = await LeaveRequest.findByPk(Id);
//     if (!data) return res.status(404).json({ error: "Not found" });
//     const existingRequest = await LeaveRequest.findOne({
//       where: {
//         school_id: school_id,
//         user_id: user_id,
//         student_id: student_id,
//         from_date: from_date,
//         to_date: to_date,
//         id: { [Op.ne]: Id },
//       },
//     });
//     if (existingRequest) {
//       return res.status(400).json({ error: "Leave request already exists" });
//     }
//     let fileName = data.attachment;
//     if (req.file) {
//       const uploadPath = "uploads/leave_requests/";
//       await deletefilewithfoldername(fileName, uploadPath);
//       fileName = await compressAndSaveFile(req.file, uploadPath);
//     }
//     await data.update({
//       student_id: student_id,
//       from_date: from_date,
//       to_date: to_date,
//       leave_type: leave_type,
//       reason: reason,
//       attachment: fileName ? fileName : null,
//       leave_duration,
//     });

//     res.status(200).json(data);
//   } catch (error) {
//     console.error("Update Error:", error);
//     res.status(500).json({ error: "Failed to update leave request" });
//   }
// };
const leaveRequestPermission = async (req, res) => {
  try {
    const Id = req.params.id;
    const school_id = req.user.school_id;
    const userId = req.user.user_id;
    const status = req.query.status;
    const admin_remarks = req.query.admin_remarks;

    if (!userId || !status) {
      return res.status(400).json({ error: "User ID and status are required" });
    }

    const leaveRequest = await LeaveRequest.findOne({
      where: { id: Id, trash: false, school_id },
    });
    if (!leaveRequest) return res.status(404).json({ error: "Not found" });

    const SchoolDetails = await School.findOne({
      where: { id: school_id },
      attributes: ["attendance_count"],
    });
    const attendance_count = SchoolDetails.attendance_count;

    leaveRequest.approved_by = userId;
    leaveRequest.admin_remarks = admin_remarks;

    if (status === "approved") {
      leaveRequest.status = "approved";

      const student_id = leaveRequest.student_id;
      const fromDate = moment(leaveRequest.from_date);
      const toDate = moment(leaveRequest.to_date);
      const student = await Student.findOne({
        where: { id: student_id },
      });

      // ✅ Determine period count based on leave type (half/full)
      let periodCount;
      if (leaveRequest.leave_duration === "half") {
        periodCount = Math.ceil(attendance_count / 2); // odd numbers → ceiling
      } else {
        periodCount = attendance_count; // full leave = all periods
      }
      const dates = [];
      let current = moment(fromDate);
      while (current.isSameOrBefore(toDate, "day")) {
        dates.push(current.format("YYYY-MM-DD"));
        current.add(1, "days");
      }

      for (const date of dates) {
        // ✅ Loop through each period
        for (let period = 1; period <= periodCount; period++) {
          let attendance = await Attendance.findOrCreate({
            where: {
              school_id,
              date,
              class_id: student.class_id,
              period, // ✅ store period number individually
            },
          });
          const attendanceRecord = await AttendanceMarked.findOne({
            where: {
              attendance_id: attendance[0].id,
              student_id,
            },
          });

          if (attendanceRecord) {
            // update existing
            await attendanceRecord.update({
              status: "leave",
              remarks:
                leaveRequest.leave_type === "half"
                  ? "Half-day Leave approved"
                  : "Full-day Leave approved",
            });
          } else {
            // create new
            await AttendanceMarked.create({
              attendance_id: attendance[0].id,
              student_id,
              status: "leave",
              remarks:
                leaveRequest.leave_type === "half"
                  ? "Half-day Leave approved"
                  : "Full-day Leave approved",
            });
          }
        }
      }
    } else if (status === "rejected") {
      leaveRequest.status = "rejected";
    } else {
      return res.status(400).json({ error: "Invalid status" });
    }

    await leaveRequest.save();
    res.status(200).json({
      message: `Leave request ${status} successfully`,
    });
  } catch (error) {
    console.error("Approve Error:", error);
    res.status(500).json({ error: "Failed to approve leave request" });
  }
};

//GET STUDENT LEAVE REQUESTS BY CLASS
const getStudentLeaveRequestsForClassTeacher = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const school_id = req.user.school_id;
    const staff = await Staff.findOne({ where: { user_id, school_id } });
    const class_id = staff ? staff.class_id : null;
    const searchQuery = req.query.q || "";
    const date = req.query.date || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const whereClause = {
      trash: false,
      school_id: school_id,
      role: "student",
    };

    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { description: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    if (date) {
      whereClause.date = date;
    }
    const { count, rows: leaveRequests } = await LeaveRequest.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ["id", "full_name", "reg_no", "class_id"],
          where: { class_id: class_id },
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      leaveRequests,
    });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
};

//parent note section

const createParentNote = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;

    const { note_title, note_content, studentIds } = req.body; // pass selected student ids
    let fileName = null;
    if (req.file) {
      const uploadPath = "uploads/parent_notes/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
    }

    // ✅ Create the parent note
    const note = await ParentNote.create({
      school_id,
      note_title,
      note_content,
      note_attachment: fileName,
      recorded_by,
    });
    if (studentIds && Array.isArray(studentIds)) {
      for (const student_id of studentIds) {
        const guardianId = await getGuarduianIdbyStudentId(student_id);
        if (guardianId) {
          // build message payload
          const messageData = {
            receiver_id: guardianId,
            student_id,
            parentnote_id: note.id,
          };

          await sendMessageWithParentNote(
            req.io,
            { user: req.user, emit: () => {} },
            messageData
          );

          // OR directly emit here
          // req.io.to(`user_${guardianId}`).emit("parentNoteMsg", {
          //   type: "parent_notes",
          //   type_id: note.note_id,
          //   message: note_title,
          //   student_id,
          //   createdAt: new Date(),
          // });
        }
      }
    }

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getAllOwnCreatedParentNotes = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || "";
    const whereClause = {
      school_id,
      recorded_by,
    };
    if (searchQuery) {
      whereClause[Op.or] = [
        { note_title: { [Op.like]: `%${searchQuery}%` } },
        { note_content: { [Op.like]: `%${searchQuery}%` } },
      ];
    }
    const { count, rows: notes } = await ParentNote.findAndCountAll({
      offset,
      distinct: true,
      limit,
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalcontent: count,
      totalPages,
      currentPage: page,
      notes,
    });
  } catch (err) {
    console.error("Error fetching parent notes:", err);
    res.status(500).json({ error: "Failed to fetch parent notes" });
  }
};
const getParentNoteById = async (req, res) => {
  try {
    const id = req.params.id;
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;

    const note = await ParentNote.findOne({
      where: { id, school_id, recorded_by },
    });

    if (!note) {
      return res.status(404).json({ error: "Parent note not found" });
    }

    res.status(200).json(note);
  } catch (err) {
    console.error("Error fetching parent note:", err);
    res.status(500).json({ error: "Failed to fetch parent note" });
  }
};
const updateParentNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;

    const note = await ParentNote.findOne({
      where: { id: noteId, school_id, recorded_by },
    });

    if (!note) {
      return res.status(404).json({ error: "Parent note not found" });
    }

    const { note_title, note_content } = req.body;
    let fileName = note.note_attachment;
    if (req.file) {
      const uploadPath = "uploads/parent_notes/";
      fileName = await compressAndSaveFile(req.file, uploadPath);
      // Delete old file if it exists
      if (note.note_attachment) {
        await deletefilewithfoldername(note.note_attachment, uploadPath);
      }
    }

    await note.update({
      note_title,
      note_content,
      note_attachment: fileName,
    });

    res.status(200).json(note);
  } catch (err) {
    console.error("Error updating parent note:", err);
    res.status(500).json({ error: "Failed to update parent note" });
  }
};

const deleteParentNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const school_id = req.user.school_id;
    const recorded_by = req.user.user_id;

    const note = await ParentNote.findOne({
      where: { id: noteId, school_id, recorded_by },
    });

    if (!note) {
      return res.status(404).json({ error: "Parent note not found" });
    }
    await note.update({ trash: true });
    res.status(200).json({ message: "Parent note deleted successfully" });
  } catch (err) {
    console.error("Error deleting parent note:", err);
    res.status(500).json({ error: "Failed to delete parent note" });
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
    console.error("Error fetching notices:", error);
    res.status(500).json({ error: "Failed to fetch notices" });
  }
};
const getTodayTimetableForStaff = async (req, res) => {
  try {
    const school_id = req.user.school_id;
    const staff_id = req.user.user_id;
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
        school_id,
        staff_id,
        day_of_week: today,
      },
      order: [["period_number", "ASC"]],
      include: [
        { model: Subject, attributes: ["id", "subject_name"] }, // optional
        { model: Class, attributes: ["id", "classname"] }, // optional
      ],
    });

    const substitutions = await TimetableSubstitution.findAll({
      where: {
        sub_staff_id: staff_id,
        school_id,
        date,
      },
      order: [
        ["date", "ASC"],
        ["timetable_id", "ASC"],
      ],
      include: [
        {
          model: Timetable,
          attributes: ["id", "day_of_week", "period_number"],
          required: false,
          include: [
            {
              model: Class,
              attributes: ["id", "classname"],
            },
          ],
        },
        { model: Subject, attributes: ["id", "subject_name"] },
      ],
    });

    return res.json({
      message: `Here is ${message}`,
      today,
      timetable,
      substitutions,
    });
  } catch (error) {
    console.error("getTodayTimetableForStaff error:", error);
    return res.status(500).json({ error: error.message });
  }
};
const getAllDaysTimetableForStaff = async (req, res) => {
  try {
    const staff_id = req.user.user_id;
    const school_id = req.user.school_id;
    const timetable = await Timetable.findAll({
      where: {
        staff_id,
        school_id,
      },
      order: [
        ["day_of_week", "ASC"],
        ["period_number", "ASC"],
      ],
      include: [
        { model: Subject, attributes: ["id", "subject_name"] }, // optional
        { model: Class, attributes: ["id", "classname"] }, // optional
      ],
    });

    return res.json({
      timetable,
    });
  } catch (error) {
    console.error("getAllDaysTimetableForStaff error:", error);
    return res.status(500).json({ error: error.message });
  }
};
//get datewise timetablesubstitute  for staff
// const getSubstituteTimetableForStaff = async (req, res) => {
//   try {
//     const staff_id = req.user.user_id;
//     const school_id = req.user.school_id;
//     const date = req.params.date || new Date().toISOString().split("T")[0];
//     let whereClause = {
//       sub_staff_id: staff_id,
//       school_id,
//       // date,
//     };

//     const timetable = await TimetableSubstitution.findAll({
//       where: whereClause,
//       order: [
//         ["date", "ASC"],
//         ["timetable_id", "ASC"],
//       ],
//       include: [
//         {
//           model: Timetable,
//           attributes: ["id", "day_of_week", "period_number"],
//           required: false,
//           include: [
//             {
//               model: Class,
//               attributes: ["id", "classname"],
//             },
//           ],
//         },
//         { model: Subject, attributes: ["id", "subject_name"] },
//       ],
//     });
//     return res.json({
//       timetable,
//     });
//   } catch (error) {
//     console.error("getSubstituteTimetableForStaff error:", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

module.exports = {
  createExamWithMarks,
  getAllmarks,
  getInternalMarksById,
  updateExam,
  updateMark,
  deleteExam,
  getInternalMarkByRecordedBy,
  bulkUpdateMarks,

  createHomeworkWithAssignments,
  getAllHomework,
  getHomeworkById,
  updateHomework,
  deleteHomework,
  restoreHomework,
  updateHomeworkAssignment,
  permanentDeleteHomework,
  bulkUpdateHomeworkAssignments,
  getHomeworkAssignmentById,
  getHomeworkByTeacher,

  createAttendance,
  getAllAttendance,
  updateAttendance,
  updateAttendanceMarkedById,
  deleteAttendance,
  restoreAttendance,
  permanentDeleteAttendance,
  getAttendanceById,
  getTrashedAttendanceByTeacher,
  getAttendanceByTeacher,
  bulkUpdateAttendanceById,
  getAttendanceByclassIdAndDate, //do not checked
  getAllClassesAttendanceStatus,

  getAllDuties,
  getAssignedDutyById,
  updateAssignedDuty,

  createAchievementWithStudents,
  getAllAchievementsByStaffId,
  getAchievementById,
  updateAchievement,
  deleteAchievement,
  restoreAchievement,
  updateStudentAchievement,

  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest,
  restoreLeaveRequest,
  // createStudentLeaveRequest,
  // updateStudentLeaveRequest,
  getStudentLeaveRequestsForClassTeacher,
  leaveRequestPermission,

  createParentNote,
  getAllOwnCreatedParentNotes,
  getParentNoteById,
  updateParentNote,
  deleteParentNote,

  getLatestNotices,

  getTodayTimetableForStaff,
  getAllDaysTimetableForStaff,
  // getSubstituteTimetableForStaff,
};
