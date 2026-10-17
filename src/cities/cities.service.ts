import { Injectable } from '@nestjs/common';
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

  create(createCityDto: CreateCityDto) {
    void createCityDto;
    return 'This action adds a new city';
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

  findOne(id: string) {
    return `This action returns a #${id} city`;
  }

  update(id: string, updateCityDto: UpdateCityDto) {
    void updateCityDto;
    return `This action updates a #${id} city`;
  }

  remove(id: string) {
    return `This action removes a #${id} city`;
  }
}
