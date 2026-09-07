"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stop_routes", {
      route_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "route",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      stop_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "stop",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });

    await queryInterface.sequelize.query(
      "INSERT INTO stop_routes (route_id, stop_id, priority) " +
        "SELECT route_id, id, priority FROM stop",
    );

    const foreignKeys = await queryInterface.getForeignKeyReferencesForTable("stop");
    for (const foreignKey of foreignKeys) {
      if (foreignKey.columnName === "route_id") {
        await queryInterface.removeConstraint("stop", foreignKey.constraintName);
      }
    }

    for (const index of await queryInterface.showIndex("stop")) {
      if (index.name === "IDX_ROUTE_PRIORITY_UNIQUE") {
        await queryInterface.removeIndex("stop", index.name);
      }
    }

    await queryInterface.removeColumn("stop", "route_id");
    await queryInterface.removeColumn("stop", "priority");
    //add new colom in stop table for school_id
    await queryInterface.addColumn("stop", "school_id", {
      type: Sequelize.INTEGER,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("stop", "route_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "route",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    await queryInterface.addColumn("stop", "priority", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      "UPDATE stop s INNER JOIN stop_routes sr ON sr.stop_id = s.id " +
        "SET s.route_id = sr.route_id, s.priority = sr.priority",
    );

    await queryInterface.dropTable("stop_routes");
  },
};
