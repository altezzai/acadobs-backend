'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Change column to string to safely update the values without truncation
    await queryInterface.changeColumn('subjects', 'class_range', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 2. Update existing data to map to new enum values
    await queryInterface.sequelize.query(`UPDATE subjects SET class_range = 'FS' WHERE class_range = '1-4'`);
    await queryInterface.sequelize.query(`UPDATE subjects SET class_range = 'PS' WHERE class_range = '5-7'`);
    await queryInterface.sequelize.query(`UPDATE subjects SET class_range = 'MS' WHERE class_range = '8-10'`);
    await queryInterface.sequelize.query(`UPDATE subjects SET class_range = 'SS' WHERE class_range = '11-12'`);

    // 3. Change column to the new ENUM
    await queryInterface.changeColumn('subjects', 'class_range', {
      type: Sequelize.ENUM('FS', 'PS', 'MS', 'SS', 'common', 'other'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // 1. Change column back to string
    await queryInterface.changeColumn('subjects', 'class_range', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // 2. Revert the data mapping
    await queryInterface.sequelize.query(`UPDATE subjects SET class_range = '1-4' WHERE class_range = 'FS'`);
    await queryInterface.sequelize.query(`UPDATE subjects SET class_range = '5-7' WHERE class_range = 'PS'`);
    await queryInterface.sequelize.query(`UPDATE subjects SET class_range = '8-10' WHERE class_range = 'MS'`);
    await queryInterface.sequelize.query(`UPDATE subjects SET class_range = '11-12' WHERE class_range = 'SS'`);
    //add new enum 

    // 3. Change column back to original ENUM
    await queryInterface.changeColumn('subjects', 'class_range', {
      type: Sequelize.ENUM('1-4', '5-7', '8-10', '11-12', 'other'),
      allowNull: false,
    });
  }
};
