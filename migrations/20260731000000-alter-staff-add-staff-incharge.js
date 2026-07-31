module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("staffs", "staff_incharge", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("staffs", "staff_incharge");
  },
};
