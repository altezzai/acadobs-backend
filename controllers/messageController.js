const moment = require("moment");
const bcrypt = require("bcrypt");
const { Op, where, Sequelize } = require("sequelize");
const logger = require("../utils/logger");
const { schoolSequelize } = require("../config/connection");

const {
  normalizeGender,
  normalizeGuardianRelation,
} = require("../utils/supportingFunction");
const { School } = require("../models");
const Message = require("../models/messages");
const Chat = require("../models/chat");
const User = require("../models/user");
const Homework = require("../models/homework");
const Achievement = require("../models/achievement");
const ParentNote = require("../models/parent_note");
const InternalMark = require("../models/internal_marks");
const Payment = require("../models/payment");
const Attendance = require("../models/attendance");
const Notice = require("../models/notice");
const Invoice = require("../models/invoice");


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
            attributes: {
                include: [
                    [
                        Sequelize.literal(`
                            (
                                SELECT COUNT(*)
                                FROM messages AS unread_messages
                                WHERE unread_messages.chat_id = Chat.id
                                AND unread_messages.receiver_id = ${user_id}
                            )
                        `),
                        "unseenCount"
                    ]
                ]
            },
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
                                "name"
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
                unseenCount: Number(chatData.unseenCount) || 0,
                updatedAt: chatData.updatedAt
            };
        });
        await Message.update({
            status: "received"
        }, {
            where: {
                chat_id: {
                    [Op.in]: chats.map((chat) => chat.id)
                },
                receiver_id: user_id,
                status: "sent"
            }
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
const getMessagesByChatId = async(req,res) => {
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
            trash:false,
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
        const {count,rows:messages} = await Message.findAndCountAll({
            where: whereClause2,
            offset,
            limit,
            distinct: true,
            attributes:[
                "id",
                "message",
                "sender_id",
                "status",
                "type",
                "type_id",
                "replyToId",
                "student_id",
                "createdAt",
                "updatedAt",
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
            order: [["id", "DESC"]],
        });
          const typeModels = {
             Achievement,
             Homework,
             ParentNote,
             InternalMark,
             Payment,
             Attendance,
             Notice,
             Invoice,
        };

        const data = await Promise.all(
            messages.map(async (message) => {
                const messageData = message.toJSON();

                let typeData = null;

                if (
                    messageData.type &&
                    messageData.type_id &&
                    typeModels[messageData.type]
                ) {
                    typeData = await typeModels[
                        messageData.type
                    ].findByPk(messageData.type_id);
                }

                return {
                    ...messageData,
                    typeData
                };
            })
        );
        await Message.update({
            status:"read"
        },{
            where:{
                chat_id,
                receiver_id: user_id,
            },
        });
        const opponent = chats.user1_id == user_id ? chats.user2 : chats.user1;
        const totalPages = Math.ceil(count / limit);
        res.status(200).json({ 
            message: "Messages fetched successfully", 
            totalContent: count,
            currentPage: page,
            totalPages,
            opponent,
            data,
        });
    } catch (error) {
        logger.error("getMessagesByChatId error:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
}
module.exports = {
    createMessage,
    myChats,
    getMessagesByChatId,
}

