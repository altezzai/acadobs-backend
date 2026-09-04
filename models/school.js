"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const Attendance = require("./attendance");

const School = schoolSequelize.define(
  "School",
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.TEXT,
    logo: DataTypes.STRING,
    period_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
    },
    attendance_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
    },
    syllabus_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "syllabuses",
        key: "id",
      },
    },
    education_year_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pass_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 40.0,
    },
    primary_colour: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    secondary_colour: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bg_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    upi_id: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    upi_name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    payment_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      defaultValue: null,
    },
    short_name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    tagline: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    about: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    alternate_phone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    district: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    google_map_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    facebook_url: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    instagram_url: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    youtube_url: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    admission_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    seo_title: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    seo_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    payment_section: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    transpotation_section: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    ai_section: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },

    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "schools",
    timestamps: true,
  }
);

module.exports = School;
