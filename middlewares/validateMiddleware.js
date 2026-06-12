const { validationResult, matchedData } = require('express-validator');

/**
 * Global validation handler to process express-validator chains.
 * If validation fails, responds with 400 Bad Request.
 * If validation succeeds, it strictly ENFORCES WHITELISTING by 
 * dropping any properties present in the request that were not part of the schema.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: "Input validation error",
       errors: errors.array() 
    });
  }

  // Replace original objects exclusively with the whitelisted, sanitized data.
  // Properties not defined in the express-validator schema are discarded.
  const bodyData = matchedData(req, { locations: ['body'] });
  const queryData = matchedData(req, { locations: ['query'] });
  const paramsData = matchedData(req, { locations: ['params'] });

  // Clear existing object properties and assign whitelisted data to avoid read-only errors
  if (Object.keys(req.body).length > 0 || Object.keys(bodyData).length > 0) {
    Object.keys(req.body).forEach(k => delete req.body[k]);
    Object.assign(req.body, bodyData);
  }
  if (Object.keys(req.query).length > 0 || Object.keys(queryData).length > 0) {
    Object.keys(req.query).forEach(k => delete req.query[k]);
    Object.assign(req.query, queryData);
  }
  if (Object.keys(req.params).length > 0 || Object.keys(paramsData).length > 0) {
    Object.keys(req.params).forEach(k => delete req.params[k]);
    Object.assign(req.params, paramsData);
  }

  next();
};

module.exports = {
  validate,
};
