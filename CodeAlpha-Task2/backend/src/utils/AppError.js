/*
 * An error we throw on purpose (404, 409, 422...). The error middleware
 * sends its message to the client; any other error becomes a generic 500.
 */
export default class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
