export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Invalid request") {
    super(400, "BAD_REQUEST", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Missing or invalid X-User-Id header") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class SoldOutError extends AppError {
  constructor(message: string = "Insufficient inventory or sold out") {
    super(409, "SOLD_OUT", message);
  }
}

export class AlreadyCheckedInError extends AppError {
  public checkedInAt: Date | string | null;

  constructor(checkedInAt: Date | string | null, message: string = "Ticket has already been checked in") {
    super(409, "ALREADY_CHECKED_IN", message, { checkedInAt });
    this.checkedInAt = checkedInAt;
  }
}
