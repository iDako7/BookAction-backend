export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
}

export interface LoginDTO {
  emailOrUsername: string;
  password: string;
}
