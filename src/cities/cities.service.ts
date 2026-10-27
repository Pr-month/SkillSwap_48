import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { GetCitiesDto } from './dto/get-cities.dto';
import { City } from './entities/city.entity';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly citiesRepository: Repository<City>,
  ) {}

  async create(createCityDto: CreateCityDto): Promise<City> {
    const { name } = createCityDto;

    const existing = await this.citiesRepository.findOne({
      where: { name },
    });

    if (existing) {
      throw new ConflictException(`City with name ${name} already exists`);
    }

    const city = this.citiesRepository.create({ name });
    return this.citiesRepository.save(city);
  }

  async findAll({ search = '' }: GetCitiesDto): Promise<City[]> {
    const queryBuilder = this.citiesRepository.createQueryBuilder('city');

    if (search) {
      queryBuilder.where('city.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    return queryBuilder.orderBy('city.name', 'ASC').take(10).getMany();
  }

  async findOne(id: string): Promise<City> {
    const city = await this.citiesRepository.findOne({ where: { id } });

    if (!city) {
      throw new NotFoundException(`City with id ${id} not found`);
    }

    return city;
  }

  async update(id: string, updateCityDto: UpdateCityDto): Promise<City> {
    const city = await this.citiesRepository.findOne({ where: { id } });

    if (!city) {
      throw new NotFoundException(`City with id ${id} not found`);
    }

    if (updateCityDto.name && updateCityDto.name !== city.name) {
      const existing = await this.citiesRepository.findOne({
        where: { name: updateCityDto.name },
      });

      if (existing) {
        throw new ConflictException(
          `City with name ${updateCityDto.name} already exists`,
        );
      }
    }

    Object.assign(city, updateCityDto);
    return this.citiesRepository.save(city);
  }

  async remove(id: string): Promise<void> {
    const city = await this.citiesRepository.findOne({ where: { id } });

    if (!city) {
      throw new NotFoundException(`City with id ${id} not found`);
    }

    await this.citiesRepository.remove(city);
  }
}
