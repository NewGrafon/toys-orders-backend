import {
  CanActivate,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  IS_PUBLIC_KEY,
  ONLY_ANON_KEY,
  ROLES_KEY,
} from '../../static/decorators/auth.decorators';
import { Role } from '../../static/enums/users.enum';
import { ExceptionMessages } from '../../static/enums/messages.enums';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TOKEN_KEY } from '../../static/consts/token.const';
import { UsersService } from '../../users/users.service';
import { UserEntity } from '../../users/entities/user.entity';
import { IPayload } from '../../static/interfaces/auth.interfaces';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let token = this.extractTokenFromHeader(request);
    let payload: IPayload;
    let user: UserEntity;

    if (token) {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('SECRET_WORD'),
      });
      if (payload?.id) {
        user = await this.usersService.findById(payload.id);
        if (user && new Date(user.updatedAt).getTime() === payload.updatedAt) {
          request['user'] = user;
        } else {
          token = undefined;
          payload = undefined;
          user = undefined;
        }
      }
    }

    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || false;

    if (isPublic) {
      return true;
    }

    const onlyAnonymous =
      this.reflector.getAllAndOverride<boolean>(ONLY_ANON_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || false;

    if (onlyAnonymous) {
      return !!(token === undefined || token?.length === 0 || user?.deletedAt);
    }

    if (!token) {
      throw new UnauthorizedException(ExceptionMessages.Unauthorized);
    }

    if (user?.deletedAt) {
      throw new UnauthorizedException(ExceptionMessages.Unauthorized);
    }

    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (requiredRoles.length === 0) {
      return true;
    }

    if (requiredRoles.includes(user?.role) || user?.role === Role.Admin) {
      return true;
    } else {
      throw new UnauthorizedException(ExceptionMessages.Unauthorized);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const cookieToken = this.getCookie(TOKEN_KEY, request.headers.cookie);

    return cookieToken ? cookieToken : request.headers.authorization;
  }

  private getCookie(key: string, cookiesString: string) {
    try {
      const cookieArr = cookiesString.split(';');

      for (let i = 0; i < cookieArr.length; i++) {
        const cookiePair = cookieArr[i].split('=');
        if (key === cookiePair[0].trim()) {
          return decodeURIComponent(cookiePair[1]);
        }
      }
    } catch (e) {
      return null;
    }

    return null;
  }
}
