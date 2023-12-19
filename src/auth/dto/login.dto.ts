import { IsInt, IsString } from "@nestjs/class-validator";

export class LoginDto {
  @IsInt()
  id: number;

  @IsString()
  password: string;
}