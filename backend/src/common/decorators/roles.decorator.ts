import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given roles, e.g. @Roles(Role.ADMIN, Role.DOCTOR). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
