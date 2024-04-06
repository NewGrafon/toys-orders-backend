import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateToyDto } from './dto/create-toy.dto';
import { ToyEntity } from './entities/toy.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository, UpdateResult } from 'typeorm';
import { ICacheKeys } from 'src/static/interfaces/cache.interfaces';
import { LocalCacheService } from 'src/cache/local-cache.service';
import { ExceptionMessages } from 'src/static/enums/messages.enums';
import { readFileSync, existsSync } from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ToysService {
  constructor(
    @InjectRepository(ToyEntity)
    private readonly repository: Repository<ToyEntity>,
    private readonly cacheService: LocalCacheService,
    private readonly configService: ConfigService,
  ) {
    setTimeout(async () => {
      if (this.configService.get('UPDATE_TOYS_FROM_FILE') !== undefined) {
        console.log('UPDATE TOYS FROM FILE STARTED...');
        await this.updateToysFromFile();
        console.log('UPDATE TOYS FROM FILE END.');
      }
    }, 1000);
  }

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

    return this.findOneById(newToy.id);
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

  async findOneById(id: number): Promise<ToyEntity> {
    const cachedData = (await this.cacheService.get(
      this.cacheKeys.toyById(id),
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

    await this.cacheService.set(this.cacheKeys.toyById(id), toy, 300);

    return toy;
  }

  async findOneByCode(code: number): Promise<ToyEntity> {
    const cachedData = (await this.cacheService.get(
      this.cacheKeys.toyByCode(code),
    )) as ToyEntity;

    if (cachedData) {
      return cachedData;
    }

    const toy = await this.repository.findOneBy({
      code,
    });

    if (!toy) {
      throw new ForbiddenException(ExceptionMessages.ToyNotFound);
    }

    await this.cacheService.set(this.cacheKeys.toyByCode(code), toy, 300);

    return toy;
  }

  // update(id: number, updateToyDto: UpdateToyDto) {
  //   return `This action updates a #${id} toy`;
  // }

  async remove(id: number) {
    const cachedData = (await this.cacheService.get(
      this.cacheKeys.toyById(id),
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

  async updateToysFromFile(): Promise<void> {
    if (existsSync('../toys-orders-backend/result.json')) {
      try {
        const toysFromFile: {
          code: number;
          name: string;
          color_codes: number[];
        }[] = JSON.parse(
          readFileSync('../toys-orders-backend/result.json').toString(),
        );

        const allToys: ToyEntity[] = await this.repository.find({
          select: {
            code: true,
            defaultColorCodes: true,
          },
        });

        const allPromises: Promise<InsertResult | UpdateResult>[] = [];
        toysFromFile.forEach((fileToy) => {
          const fetchedToy = allToys.find((toy) => toy.code === fileToy.code);
          const fileDefaultColorCodes = Array.from(
            new Set<number>(fileToy.color_codes),
          )
            .filter((code) => code >= 1)
            .sort();
          if (!fetchedToy) {
            allPromises.push(
              this.repository.insert({
                code: fileToy.code,
                partName: fileToy.name.toString(),
                defaultColorCodes: fileDefaultColorCodes,
              }),
            );
          } else if (
            fetchedToy.defaultColorCodes.sort() + '' !==
            fileDefaultColorCodes.sort() + ''
          ) {
            allPromises.push(
              this.repository.update(
                {
                  code: fetchedToy.code,
                },
                {
                  defaultColorCodes: fileDefaultColorCodes,
                },
              ),
            );
          }
        });
        await Promise.all(allPromises);
      } catch (e) {
        console.error(e);
      }
    } else {
      console.error('FILE NOT FOUND!');
    }
  }
}
