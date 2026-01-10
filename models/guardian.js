const { DataTypes } = require("sequelize");
const { schoolSequelize } = require("../config/connection");
const User = require("./user");
const Guardian = schoolSequelize.define(
  "Guardian",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    guardian_relation: {
      type: DataTypes.ENUM(
        "father",
        "mother",
        "grandfather",
        "grandmother",
        "uncle",
        "aunty",
        "local_guardian",
        "other"
      ),
      allowNull: false,
      defaultValue: "father",
    },
    guardian_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guardian_contact: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guardian_email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    guardian_job: {
      type: DataTypes.STRING,
    },
    guardian2_relation: {
      type: DataTypes.ENUM(
        "father",
        "mother",
        "grandfather",
        "grandmother",
        "uncle",
        "aunty",
        "local_guardian",
        "other"
      ),
      defaultValue: "mother",
    },
    guardian2_name: {
      type: DataTypes.STRING,
    },
    guardian2_job: {
      type: DataTypes.STRING,
    },
    guardian2_contact: {
      type: DataTypes.STRING,
    },
    father_name: {
      type: DataTypes.STRING,
    },
    mother_name: {
      type: DataTypes.STRING,
    },
    house_name: {
      type: DataTypes.STRING,
    },
    street: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    landmark: {
      type: DataTypes.STRING,
    },
    district: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    country: {
      type: DataTypes.STRING,
    },
    post: {
      type: DataTypes.STRING,
    },
    pincode: {
      type: DataTypes.STRING,
    },
    trash: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "guardians",
    timestamps: true,
  }
);
Guardian.belongsTo(User, { foreignKey: "user_id" });
module.exports = Guardian;
