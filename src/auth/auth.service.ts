import { ForbiddenException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { ExceptionMessages, ResultMessages } from "../static/enums/messages.enums";
import { UserEntity } from "../users/entities/user.entity";
import bcrypt from 'bcrypt';
import { IAuthResponse } from "../static/interfaces/auth.interfaces";

@Injectable()
export class AuthService {

  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: LoginDto): Promise<IAuthResponse> {
    const fieldPassword = user.password;
    const existUser: UserEntity = await this.usersService.findById(user.id, true);

    if (!existUser) throw new ForbiddenException(ExceptionMessages.SomethingWrong);

    if (existUser) {
      if (existUser.deletedAt !== null) {
        throw new ForbiddenException(ResultMessages.LoginReject);
      }
      const passMatch = await bcrypt.compare(fieldPassword, existUser.password);
      if (!passMatch) {
        throw new ForbiddenException(ResultMessages.LoginReject);
      }
    }

    const payload = {
      id: user.id,
      sessionCreatedAt: new Date().getTime(),
    };

    return {
      session_token: await this.jwtService.signAsync(payload),
    };
  }
}
