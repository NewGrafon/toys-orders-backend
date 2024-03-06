import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateToyDto } from './dto/create-toy.dto';
import { ToyEntity } from './entities/toy.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICacheKeys } from 'src/static/interfaces/cache.interfaces';
import { LocalCacheService } from 'src/cache/local-cache.service';
import { ExceptionMessages } from 'src/static/enums/messages.enums';

@Injectable()
export class ToysService {
  constructor(
    @InjectRepository(ToyEntity)
    private readonly repository: Repository<ToyEntity>,
    private readonly cacheService: LocalCacheService,
  ) {}

  readonly cacheKeys: ICacheKeys = this.cacheService.cacheKeys();

  async create(createToyDto: CreateToyDto) {
    const exists = await this.repository.findOne({
      where: {
        code: createToyDto.code,
      },
    });

    if (exists?.id) {
      throw new ForbiddenException(ExceptionMessages.ToyExists);
    }

    const newToy = (await this.repository.insert(createToyDto))
      .generatedMaps[0] as ToyEntity;

    await this.cacheService.del(this.cacheKeys.allToys());

    return this.findOne(newToy.id);
  }

  async findAll(): Promise<ToyEntity[]> {
    const cachedData: ToyEntity[] = (await this.cacheService.get(
      this.cacheKeys.allToys(),
    )) as ToyEntity[];

    if (cachedData) {
      return cachedData;
    }

    const toys = await this.repository.find();

    await this.cacheService.set(this.cacheKeys.allToys(), toys, 600);

    return toys;
  }

  async findOne(id: number): Promise<ToyEntity> {
    const cachedData = (await this.cacheService.get(
      this.cacheKeys.toy(id),
    )) as ToyEntity;

    if (cachedData) {
      return cachedData;
    }

    const toy = await this.repository.findOneBy({
      id,
    });

    if (!toy) {
      throw new ForbiddenException(ExceptionMessages.ToyNotFound);
    }

    await this.cacheService.set(this.cacheKeys.toy(id), toy, 300);

    return toy;
  }

  // update(id: number, updateToyDto: UpdateToyDto) {
  //   return `This action updates a #${id} toy`;
  // }

  async remove(id: number) {
    const cachedData = (await this.cacheService.get(
      this.cacheKeys.toy(id),
    )) as ToyEntity;

    const toy = cachedData ?? (await this.repository.findOneBy({ id }));

    if (!toy) {
      throw new ForbiddenException(ExceptionMessages.ToyNotFound);
    }

    await Promise.all([
      this.repository.remove(toy),
      this.cacheService.del(this.cacheKeys.allToys()),
    ]);

    this.findAll();

    return true;
  }
}
