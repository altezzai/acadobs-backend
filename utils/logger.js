const util = require("node:util");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}] : ${message}`;
});

const baseLogger = createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    colorize(),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/app.log" }),
    new transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

const wrapLoggerMethod = (methodName) => (...args) => {
  const formatted = util.format(...args);
  return baseLogger[methodName](formatted);
};

const logger = {
  error: wrapLoggerMethod("error"),
  warn: wrapLoggerMethod("warn"),
  info: wrapLoggerMethod("info"),
  http: wrapLoggerMethod("http"),
  verbose: wrapLoggerMethod("verbose"),
  debug: wrapLoggerMethod("debug"),
  silly: wrapLoggerMethod("silly"),
};

module.exports = logger;
