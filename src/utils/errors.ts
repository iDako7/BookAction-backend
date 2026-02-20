export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthError extends AppError {
  constructor(message: string, statusCode = 401) {
    super(message, statusCode);
    this.name = "AuthError";
  }
}
