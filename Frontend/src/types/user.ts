export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: {
    _id: string;
    username: string;
    email: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}
