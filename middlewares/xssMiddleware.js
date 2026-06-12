// middlewares/xssMiddleware.js

/**
 * Recursively iterates through an object and escapes < and > characters
 * to neutralize potential XSS payloads.
 */
const sanitizeObj = (obj) => {
  if (typeof obj === 'string') {
    return obj.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  if (Array.isArray(obj)) {
    obj.forEach((val, i) => { obj[i] = sanitizeObj(val); });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach((key) => {
      obj[key] = sanitizeObj(obj[key]);
    });
  }
  return obj;
};

const globalSanitize = (req, res, next) => {
  // Mutates properties internally, bypassing getter/setter reassignment errors
  if (req.body) sanitizeObj(req.body);
  if (req.query) sanitizeObj(req.query);
  if (req.params) sanitizeObj(req.params);
  next();
};

module.exports = globalSanitize;
