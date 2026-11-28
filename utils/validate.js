// Small helpers for safe input handling, shared by all controllers.

// Make user text safe to use inside $regex / new RegExp.
// Without this, input like "(a+)+$" can freeze the server (ReDoS).
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Return the names of fields that are missing or empty in body.
const missingFields = (body, fields) =>
  fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

// Send a 400 with the missing field names, or return false if all are present.
const rejectMissing = (res, body, fields) => {
  const missing = missingFields(body, fields);
  if (missing.length === 0) return false;
  res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
  return true;
};

// Send the right status for an error caught in a controller.
// Bad input (Mongoose validation, bad ObjectId) gets 400; anything else gets 500.
const sendError = (res, error) => {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: 'Server error' });
};

module.exports = { escapeRegex, rejectMissing, sendError };
