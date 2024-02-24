import { PartialType } from '@nestjs/swagger';
import { CreateToyDto } from './create-toy.dto';

export class UpdateToyDto extends PartialType(CreateToyDto) {}
