export interface IAuthResponse {
  session_token: string | null;
  expiresIn: number | string;
}

export interface IPayload {
  id: number;
  updatedAt: number;
}
