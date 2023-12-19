import { IsEnum, IsString } from '@nestjs/class-validator';
import { Transform } from '@nestjs/class-transformer';
import { Role } from '../../static/enums/users.enum';

export class CreateUserDto {
  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  firstname: string;

  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  lastname: string;

  @IsString()
  password: string;

  @IsEnum(Role)
  role: Role;
}
