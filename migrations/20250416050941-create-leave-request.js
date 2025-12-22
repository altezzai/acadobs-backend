"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("leave_requests", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "students",
          key: "id",
        },
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      role: {
        type: Sequelize.ENUM("student", "staff", "teacher"),
        allowNull: false,
      },
      leave_duration: {
        type: Sequelize.ENUM("half", "full"),
        defaultValue: "full",
      },
      half_section: {
        type: Sequelize.ENUM("forenoon", "afternoon"),
        allowNull: true,
      },
      reason: { type: Sequelize.TEXT, allowNull: false },
      leave_type: {
        type: Sequelize.ENUM(
          "sick",
          "casual",
          "emergency",
          "vacation",
          "other"
        ),
        defaultValue: "other",
      },
      from_date: { type: Sequelize.DATEONLY, allowNull: false },
      to_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },

      admin_remarks: { type: Sequelize.TEXT },
      attachment: { type: Sequelize.STRING },
      trash: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
    await queryInterface.addConstraint("leave_requests", {
      fields: ["school_id", "user_id", "student_id", "from_date", "to_date"],
      type: "unique",
      name: "unique_leave_request_combination",
    });
    await queryInterface.addIndex("leave_requests", ["school_id"], {
      name: "leave_requests_school_id_idx",
    });
    await queryInterface.addIndex("leave_requests", ["user_id"], {
      name: "leave_requests_user_id_idx",
    });
    await queryInterface.addIndex("leave_requests", ["student_id"], {
      name: "leave_requests_student_id_idx",
    });
    await queryInterface.addIndex("leave_requests", ["status"], {
      name: "leave_requests_status_idx",
    });
    await queryInterface.addIndex("leave_requests", ["trash"], {
      name: "leave_requests_trash_idx",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("leave_requests");
    await queryInterface.removeIndex(
      "leave_requests",
      "leave_requests_school_id_idx"
    );
    await queryInterface.removeIndex(
      "leave_requests",
      "leave_requests_user_id_idx"
    );
    await queryInterface.removeIndex(
      "leave_requests",
      "leave_requests_student_id_idx"
    );
    await queryInterface.removeIndex(
      "leave_requests",
      "leave_requests_status_idx"
    );
    await queryInterface.removeIndex(
      "leave_requests",
      "leave_requests_trash_idx"
    );
  },
};
