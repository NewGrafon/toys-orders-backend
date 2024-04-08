import { Role } from '../../static/enums/users.enum';

export class UpdateUserDto {
  telegramUserId?: number;

  firstname?: string;

  lastname?: string;

  password?: string;

  role?: Role;
}
