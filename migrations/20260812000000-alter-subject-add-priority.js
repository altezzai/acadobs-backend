module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("subjects", "priority", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 11,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("subjects", "priority");
  },
};
