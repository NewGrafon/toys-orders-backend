import { Role } from '../../static/enums/users.enum';

export class UpdateUserDto {
  firstname?: string;

  lastname?: string;

  password?: string;

  role?: Role;
}
