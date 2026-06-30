export class ApiError extends Error {
  constructor(code, message, status = 500, details = undefined) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function validationError(details) {
  return new ApiError("VALIDATION_ERROR", "Request validation failed.", 422, details);
}

export function unauthenticated(message = "Authentication is required.") {
  return new ApiError("UNAUTHENTICATED", message, 401);
}

export function forbidden(message = "You do not have access to this resource.") {
  return new ApiError("FORBIDDEN", message, 403);
}

export function notFound(message = "Resource not found.") {
  return new ApiError("NOT_FOUND", message, 404);
}

export function conflict(code, message, details = undefined) {
  return new ApiError(code, message, 409, details);
}
