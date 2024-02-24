import {
  Min,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Max,
} from '@nestjs/class-validator';
import { ColorCode } from 'src/static/enums/colors-codes.enum';

export class CartToyDto {
  @IsNumber()
  @Min(0)
  id: number;

  @IsNotEmpty()
  @IsEnum(ColorCode)
  colorCode: ColorCode;

  @IsInt()
  @Min(-999)
  @Max(999)
  amount: number;
}
