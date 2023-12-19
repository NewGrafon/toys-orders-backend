import { SetMetadata } from '@nestjs/common';
import { Role } from "../enums/users.enum";

export const IS_PUBLIC_KEY = 'isPublic';
export const AllowAnonymous = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'role';
export const RolesList = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const ONLY_ANON_KEY = 'onlyAnonymous';
export const OnlyAnonymous = () => SetMetadata(ONLY_ANON_KEY, true);
