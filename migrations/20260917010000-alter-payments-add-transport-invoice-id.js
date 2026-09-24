"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("payments", "transport_invoice_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: {
        model: "transport_invoices",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("payments", ["transport_invoice_id"], {
      name: "payments_transport_invoice_id_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      "payments",
      "payments_transport_invoice_id_idx"
    );
    await queryInterface.removeColumn("payments", "transport_invoice_id");
  },
};
