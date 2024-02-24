import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from '@nestjs/class-validator';
import { Transform } from '@nestjs/class-transformer';
import { CartToyDto } from './cart-toy.dto';

export class CreateCartDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  cart: CartToyDto[];

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => {
    return value.replace(/\s+/g, ' ').trim();
  })
  desktop: string;
}
