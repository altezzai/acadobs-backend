"use strict";
const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const NewsImage = schoolSequelize.define(
  "NewsImage",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    news_id: { type: DataTypes.INTEGER, allowNull: false },
    image_url: { type: DataTypes.STRING, allowNull: false },
    caption: { type: DataTypes.STRING },
    trash: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "news_images",
    timestamps: true,
  }
);
module.exports = NewsImage;
