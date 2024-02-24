import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ToysService } from './toys.service';
import { CreateToyDto } from './dto/create-toy.dto';
import { AuthGuard } from '../auth/guards/auth.guard.service';
import { Role } from 'src/static/enums/users.enum';
import { RolesList } from 'src/static/decorators/auth.decorators';
import { ToyEntity } from './entities/toy.entity';

@Controller('toys')
@UseGuards(AuthGuard)
export class ToysController {
  constructor(private readonly toysService: ToysService) {}

  @Get('get_all')
  @RolesList()
  findAll(): Promise<ToyEntity[]> {
    return this.toysService.findAll();
  }

  @Get(':id')
  @RolesList()
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ToyEntity> {
    return this.toysService.findOne(id);
  }

  @Post()
  @RolesList(Role.Worker)
  create(@Body() createToyDto: CreateToyDto): Promise<ToyEntity> {
    return this.toysService.create(createToyDto);
  }

  // @Patch(':id')
  // @RolesList(Role.Worker)
  // update(@Param('id', ParseIntPipe) id: number, @Body() updateToyDto: UpdateToyDto) {
  //   return this.toysService.update(id, updateToyDto);
  // }

  @Delete(':id')
  @RolesList(Role.Worker)
  remove(@Param('id', ParseIntPipe) id: number): Promise<boolean> {
    return this.toysService.remove(id);
  }
}
