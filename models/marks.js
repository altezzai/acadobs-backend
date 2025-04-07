"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const Student = require("./student");
const Mark = schoolSequelize.define(
  "Mark",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    internal_id: DataTypes.INTEGER,
    student_id: DataTypes.INTEGER,
    marks_obtained: DataTypes.DECIMAL(5, 2),
  },
  {
    tableName: "marks",
    timestamps: true,
  }
);

Mark.belongsTo(Student, {
  foreignKey: "student_id",
});
// Mark.associate = (models) => {
//   Mark.belongsTo(models.InternalExam, {
//     foreignKey: "internal_id",
//     as: "exam",
//   });
//   Mark.belongsTo(models.Student, {
//     foreignKey: "student_id",
//     as: "student",
//   });
// };

module.exports = Mark;
