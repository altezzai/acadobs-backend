module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("guardians", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      guardian_relation: {
        type: Sequelize.ENUM(
          "father",
          "mother",
          "grandfather",
          "grandmother",
          "uncle",
          "aunty",
          "local_guardian",
          "other"
        ),
        allowNull: false,
        defaultValue: "father",
      },
      guardian_name: Sequelize.STRING,
      guardian_contact: Sequelize.STRING,
      guardian_email: {
        type: Sequelize.STRING,
        unique: true,
      },
      guardian_job: Sequelize.STRING,
      guardian2_relation: {
        type: Sequelize.ENUM(
          "father",
          "mother",
          "grandfather",
          "grandmother",
          "uncle",
          "aunty",
          "local_guardian",
          "other"
        ),
        defaultValue: "mother",
      },
      guardian2_name: Sequelize.STRING,
      guardian2_job: Sequelize.STRING,
      guardian2_contact: Sequelize.STRING,
      father_name: Sequelize.STRING,
      mother_name: Sequelize.STRING,
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
    await queryInterface.addIndex("guardians", ["user_id"], {
      name: "guardians_user_id_idx",
    });
    await queryInterface.addIndex("guardians", ["trash"], {
      name: "guardians_trash_idx",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("guardians");
    await queryInterface.removeIndex("guardians", "guardians_user_id_idx");
    await queryInterface.removeIndex("guardians", "guardians_trash_idx");
  },
};
