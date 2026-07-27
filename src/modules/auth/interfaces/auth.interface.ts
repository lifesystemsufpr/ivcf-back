import { SystemRole } from "@prisma/client";

export interface AccessToken {
  access_token: string;
  refresh_token: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  role: SystemRole;
}

export interface Payload {
  id: string;
  email: string;
  fullName: string;
  role: SystemRole;
}
