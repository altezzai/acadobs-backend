module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("schools", "location", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("schools", "pass_percent", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 40.0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("schools", "location");
    await queryInterface.removeColumn("schools", "pass_percent");
  },
};
