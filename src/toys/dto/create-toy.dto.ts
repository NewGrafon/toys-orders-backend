import { Transform } from 'class-transformer';
import { IsInt, IsString, MinLength } from 'class-validator';
import { Min } from 'class-validator';

export class CreateToyDto {
  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  @MinLength(1)
  partName: string;

  @IsInt()
  @Min(1)
  code: number;

  defaultColorCodes?: number[];
}
