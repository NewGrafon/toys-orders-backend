import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from '@nestjs/class-validator';

export class CloseOrdersDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  editedOrders: EditedOrdersClass[];
}

export class EditedOrdersClass {
  @IsInt()
  orderId: number;

  @IsNotEmpty()
  newAmount?: number;

  @IsString()
  type: 'all' | 'not-all' | 'none';
}
