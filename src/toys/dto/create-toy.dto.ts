import { Transform } from '@nestjs/class-transformer';
import { IsString, MinLength } from '@nestjs/class-validator';

export class CreateToyDto {
  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  @MinLength(1)
  partName: string;

  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  @MinLength(1)
  code: string;
}
