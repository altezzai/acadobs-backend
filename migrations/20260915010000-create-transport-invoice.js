"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transport_invoices", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schools",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      stop_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "stop",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "students",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      term: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "partially_paid",
          "paid",
          "overdue",
          "waiting_for_approval"
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      trash: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    await queryInterface.addIndex("transport_invoices", ["school_id"], {
      name: "transport_invoices_school_id_idx",
    });
    await queryInterface.addIndex("transport_invoices", ["student_id"], {
      name: "transport_invoices_student_id_idx",
    });
    await queryInterface.addIndex("transport_invoices", ["stop_id"], {
      name: "transport_invoices_stop_id_idx",
    });
    await queryInterface.addIndex("transport_invoices", ["status"], {
      name: "transport_invoices_status_idx",
    });
    await queryInterface.addIndex("transport_invoices", ["trash"], {
      name: "transport_invoices_trash_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("transport_invoices");
  },
};
