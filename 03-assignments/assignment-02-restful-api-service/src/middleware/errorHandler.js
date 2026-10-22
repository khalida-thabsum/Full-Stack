class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message;
  let fields;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Some fields are invalid';
    fields = {};
    for (const [key, e] of Object.entries(err.errors)) fields[key] = e.message;
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue)[0]} already exists`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status === 500) {
    console.error(err);
    message = 'Something went wrong on the server';
  }
  res.status(status).json({ error: { message, ...(fields && { fields }) } });
}

module.exports = errorHandler;
module.exports.HttpError = HttpError;
