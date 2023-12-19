import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../enums/users.enum';
import { getEnumValues } from '@nestjs/swagger/dist/utils/enum.utils';

export const UserRole = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number | null => {
    const request = ctx.switchToHttp().getRequest();
    const userRole: string = request.user?.role;
    return (getEnumValues(Role) as string[]).includes(userRole)
      ? request.user?.role
      : null;
  },
);
