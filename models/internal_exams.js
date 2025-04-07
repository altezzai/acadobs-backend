"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");

const InternalExam = schoolSequelize.define(
  "InternalExam",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    school_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    subject_id: DataTypes.INTEGER,
    internal_name: DataTypes.STRING,
    max_marks: DataTypes.DECIMAL(5, 2),
    date: DataTypes.DATEONLY,
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "internal_exams",
    timestamps: false,
  }
);

// Associations will be declared later
InternalExam.associate = (models) => {
  InternalExam.hasMany(models.Mark, {
    foreignKey: "internal_id",
    as: "marks",
  });

  InternalExam.belongsTo(models.Class, {
    foreignKey: "class_id",
    as: "class",
  });

  InternalExam.belongsTo(models.Subject, {
    foreignKey: "subject_id",
    as: "subject",
  });

  InternalExam.belongsTo(models.School, {
    foreignKey: "school_id",
    as: "school",
  });
};

module.exports = InternalExam;
