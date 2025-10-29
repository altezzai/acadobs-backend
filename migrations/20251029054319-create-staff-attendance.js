module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("staff_attendance", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      staff_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          "Present",
          "Absent",
          "Half Day",
          "On Leave",
          "Late"
        ),
        defaultValue: "Present",
      },
      check_in_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      check_out_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      total_hours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      marked_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      marked_method: {
        type: Sequelize.ENUM("Manual", "Self", "Biometric"),
        defaultValue: "Manual",
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      trash: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
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
    await queryInterface.addConstraint("staff_attendance", {
      fields: ["school_id", "staff_id", "date", "trash"],
      type: "unique",
      name: "unique_staff_attendance_per_day",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("staff_attendance");
  },
};
