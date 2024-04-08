import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import {
  ExceptionMessages,
  ResultMessages,
} from '../static/enums/messages.enums';
import { UserEntity } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { IAuthResponse, IPayload } from '../static/interfaces/auth.interfaces';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async login(user: LoginDto): Promise<IAuthResponse> {
    const fieldPassword = user.password;
    const existUser: UserEntity = await this.usersService.findById(
      user.id,
      true,
    );

    if (!existUser) {
      throw new ForbiddenException(ExceptionMessages.UserNotFound);
    }

    if (existUser) {
      if (existUser.deletedAt !== null) {
        throw new ForbiddenException(ResultMessages.LoginReject);
      }
      const passMatch = await bcrypt.compare(fieldPassword, existUser.password);
      if (!passMatch) {
        throw new ForbiddenException(ResultMessages.LoginReject);
      }
    }

    if (user.telegramUserId) {
      await this.usersService.update(existUser.id, {
        telegramUserId: user.telegramUserId,
      });
    }

    const payload: IPayload = {
      id: existUser.id,
      password: existUser.password,
    };

    return {
      session_token: await this.jwtService.signAsync(payload),
      expiresIn: this.configService.get('EXPIRES_IN'),
    };
  }
}
