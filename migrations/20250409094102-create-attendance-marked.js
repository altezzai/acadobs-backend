module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("attendance_marked", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      attendance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "attendance", key: "id" },
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "students",
          key: "id",
        },
      },
      status: {
        type: Sequelize.ENUM("present", "absent", "late", "leave"),
        allowNull: false,
      },
      remarks: { type: Sequelize.TEXT },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("attendance_marked");
  },
};
