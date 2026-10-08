import { Role } from '@prisma/client';

/** Shape attached to request.user after JWT validation. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/** Claims stored inside the access token. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
