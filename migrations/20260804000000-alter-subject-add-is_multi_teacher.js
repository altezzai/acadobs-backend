module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("subjects", "is_multi_teacher", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("subjects", "is_multi_teacher");
  },
};
