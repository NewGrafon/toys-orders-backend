import { IsInt, IsString } from 'class-validator';
import { IsNumber } from 'class-validator';

export class LoginDto {
  @IsInt()
  id: number;

  @IsString()
  password: string;

  @IsNumber()
  telegramUserId?: number;
}
