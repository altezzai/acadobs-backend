'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('student_route_assignments', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            student_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            route_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'route',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
        });

        // Prevent duplicate student-route pairs
        await queryInterface.addIndex('student_route_assignments', ['student_id', 'route_id'], {
            unique: true,
            name: 'unique_student_route',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('student_route_assignments');
    },
};
