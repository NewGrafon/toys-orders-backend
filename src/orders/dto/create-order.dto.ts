import { IsString, Min, IsInt, MaxLength } from '@nestjs/class-validator';
import { Transform } from '@nestjs/class-transformer';

export class CreateOrderDto {
    // @IsString()
    // @Transform(({ value }) => {
    //   return value.replace(/\s+/g, ' ').trim();
    // })
    // @MaxLength(5000)
    // fullText: string;

  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  partName: string;
  
  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  code: string;

  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  color: string;

  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  colorCode: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  desktop: string;
}
