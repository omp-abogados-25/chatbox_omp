export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  can_login: boolean;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  full_name: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string; // user id
  tokenId: string;
  iat?: number;
  exp?: number;
} 