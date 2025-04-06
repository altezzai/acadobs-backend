module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("staffs", {
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
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      role: {
        type: Sequelize.ENUM("teacher", "staff"),
        allowNull: false,
      },
      qualification: Sequelize.STRING,
      address: Sequelize.TEXT,
      class_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "classes",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      subjects: Sequelize.TEXT,
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("staffs");
  },
};
