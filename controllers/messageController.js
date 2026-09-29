const moment = require("moment");
const bcrypt = require("bcrypt");
const { Op, where } = require("sequelize");
const logger = require("../utils/logger");
const { schoolSequelize } = require("../config/connection");

const {
  normalizeGender,
  normalizeGuardianRelation,
} = require("../utils/supportingFunction");
const { School } = require("../models");
const Message = require("../models/messages");
const Chat = require("../models/chat");
const Staff = require("../models/staff");
const StaffPermission = require("../models/staff_permissions");
const StaffSubject = require("../models/staffsubject");
const Class = require("../models/class");
const Subject = require("../models/subject");
const User = require("../models/user");
const Guardian = require("../models/guardian");
const Student = require("../models/student");
const Duty = require("../models/duty");
const DutyAssignment = require("../models/dutyassignment");
const Achievement = require("../models/achievement");
const StudentAchievement = require("../models/studentachievement");
const Event = require("../models/event");
const Payment = require("../models/payment");
const LeaveRequest = require("../models/leaverequest");
const News = require("../models/news");
const NewsImage = require("../models/newsimage");
const Notice = require("../models/notice");
const NoticeClass = require("../models/noticeclass");
const Timetable = require("../models/timetables");
const TimetableSubstitution = require("../models/timetable_substitutions");
const Attendance = require("../models/attendance");
const AttendanceMarked = require("../models/attendancemarked");
const Invoice = require("../models/invoice");
const InvoiceStudent = require("../models/invoice_students");
const TransportInvoice = require("../models/transport_invoice");
const InternalMark = require("../models/internal_marks");
const Marks = require("../models/marks");
const Homework = require("../models/homework");
const HomeworkAssignment = require("../models/homeworkassignment");
const StaffAttendance = require("../models/staff_attendance");
const Syllabus = require("../models/syllabus");
const StudentTransfer = require("../models/student_transfer");
const Stop = require("../models/tracker/stop");
const StopRoute = require("../models/tracker/stop_route");
const Vehicle  = require("../models/tracker/vehicle");
const Routes = require("../models/tracker/routes");
const StudentsStopStatus = require("../models/tracker/students_stop_status");
const CoScholasticArea = require("../models/assesment/co_scholastic_area");
const Exam = require("../models/exams");
const ExamTimetable = require("../models/exam_timetable");
const SpecialClassStudent = require("../models/special_class_students");
const { error } = require("winston");
const { deleteFile } = require("../middlewares/storageUploads");

const createMessage = async (req, res) => {
    const transaction = await schoolSequelize.transaction();

    try {
        const user_id = req.user.user_id;
        const {
            receiver_id,
            message,
            student_id,
            replyToId,
            type,
            type_id
        } = req.body;

        if (!receiver_id || !user_id) {
            await transaction.rollback();
            return res.status(400).json({
                error: "Required fields are missing"
            });
        }

        let chat = await Chat.findOne({
    where: {
        [Op.or]: [
            {
                user1_id: user_id,
                user2_id: receiver_id
            },
            {
                user1_id: receiver_id,
                user2_id: user_id
            }
        ]
    },
    transaction,
    lock: transaction.LOCK.UPDATE
});

if (!chat) {
    chat = await Chat.create(
        {
            user1_id: user_id,
            user2_id: receiver_id,
            last_message: message
        },
        {
            transaction
        }
    );
} else {
    await chat.update(
        {
            last_message: message
        },
        {
            transaction
        }
    );
}

        const data = await Message.create(
            {
                chat_id: chat.id,
                sender_id: user_id,
                receiver_id,
                message,
                student_id,
                replyToId,
                type,
                type_id
            },
            {
                transaction
            }
        );

        await transaction.commit();

        return res.status(201).json({
            message: "Message created successfully",
            data
        });
    } catch (error) {
        await transaction.rollback();

        logger.error("createMessage error:", error);

        return res.status(500).json({
            error: "Failed to create message"
        });
    }
};
const myChats = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const searchQuery = req.query.q || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const whereClause = {
            [Op.or]: [
                { user1_id: user_id },
                { user2_id: user_id }
            ]
        };

        if (searchQuery) {
            whereClause[Op.and] = [
                Sequelize.literal(`
                    (
                        (
                            Chat.user1_id = ${user_id}
                            AND (
                                user2.name LIKE '%${searchQuery}%'
                                OR user2.phone LIKE '%${searchQuery}%'
                            )
                        )
                        OR
                        (
                            Chat.user2_id = ${user_id}
                            AND (
                                user1.name LIKE '%${searchQuery}%'
                                OR user1.phone LIKE '%${searchQuery}%'
                            )
                        )
                    )
                `)
            ];
        }

        const { count, rows: chats } = await Chat.findAndCountAll({
            where: whereClause,
            offset,
            limit,
            distinct: true,
            include: [
                {
                    model: User,
                    as: "user1",
                    attributes: [
                        "id",
                        "name",
                        "phone",
                        "dp"
                    ]
                },
                {
                    model: User,
                    as: "user2",
                    attributes: [
                        "id",
                        "name",
                        "phone",
                        "dp"
                    ]
                },
                {
                    model: Message,
                    attributes: [
                        "id",
                        "message",
                        "sender_id",
                        "status",
                        "type",
                        "createdAt",
                        "updatedAt"
                    ],
                    include: [
                        {
                            model: User,
                            as: "sender",
                            attributes: [
                                "id",
                                "name",
                            ]
                        }
                    ],
                    separate: true,
                    limit: 1,
                    order: [["createdAt", "DESC"]]
                }
            ],
            order: [["updatedAt", "DESC"]]
        });

        const data = chats.map((chat) => {
            const chatData = chat.toJSON();

            const opponent =
                chatData.user1_id == user_id
                    ? chatData.user2
                    : chatData.user1;

            return {
                id: chatData.id,
                user: opponent,
                message: chatData.Messages?.[0] || null,
                updatedAt: chatData.updatedAt
            };
        });

        return res.status(200).json({
            message: "Chats fetched successfully",
            totalContent: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            data
        });

    } catch (error) {
        logger.error("myChats error:", error);

        return res.status(500).json({
            error: "Failed to fetch chats"
        });
    }
};
const messagesByChatId = async(req,res) => {
    try {
        const user_id = req.user.user_id;
        const {chat_id} = req.params;
        const searchQuery = req.query.q || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        let whereClause = {
            id:chat_id,
            [Op.or]: [
                { user1_id: user_id },
                { user2_id: user_id },
            ],
        }
        const chats = await Chat.findOne({
            where:whereClause,
            include:[
                {
                    model: User,
                    as: "user1",
                    where:{[Op.ne]:{id:user_id}},
                    attributes:[
                        "id",
                        "name",
                        "phone",
                        "dp"
                    ],
                },
                {
                    model: User,
                    as: "user2",
                    where:{[Op.ne]:{id:user_id}},
                    attributes:[
                        "id",
                        "name",
                        "phone",
                        "dp"
                    ],
                },
            ],
        })
        if(!chats){
            return res.status(404).json({ error: "Chat not found" });
        }
        let whereClause2 ={
             chat_id,
                [Op.or]: [
                    { sender_id: user_id },
                    { receiver_id: user_id },
                ],
        }
        if(searchQuery){
            whereClause2.message = {
                [Op.like]: `%${searchQuery}%`
            }
        }
        const {count,rows:data} = await Message.findAndCountAll({
            where: whereClause2,
            order: [["id", "DESC"]],
        });
        const totalPages = Math.ceil(count / limit);
        res.status(200).json({ 
            message: "Messages fetched successfully", 
            totalContent: count,
            currentPage: page,
            totalPages,
            chats,
            data,
        });
    } catch (error) {
        logger.error("messagesByChatId error:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
}
module.exports = {
    createMessage,
    myChats,
    messagesByChatId,
}

