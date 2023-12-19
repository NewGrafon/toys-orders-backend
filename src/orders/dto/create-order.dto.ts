import { IsString } from "@nestjs/class-validator";
import { Transform } from "@nestjs/class-transformer";

export class CreateOrderDto {
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

  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  desktop: string;
}
