const { Sequelize } = require("sequelize");
const config = require("./config.json");
const logger = require("../utils/logger");

const environment = process.env.NODE_ENV || "development";
const schoolConfig = config[environment];

const schoolSequelize = new Sequelize(
  schoolConfig.database,
  schoolConfig.username,
  schoolConfig.password,
  {
    host: schoolConfig.host,
    dialect: schoolConfig.dialect,
    freezeTableName: true,
    underscored: true,
    logging: (msg) => logger.info(msg),
  }
);

module.exports = { schoolSequelize };
