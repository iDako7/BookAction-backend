export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
}

export interface LoginDTO {
  emailOrUsername: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role: string;
}
