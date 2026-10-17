import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
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

  findAll() {
    return 'This action returns all cities';
  }

  findOne(id: string) {
    return `This action returns a #${id} city`;
  }

  update(id: string, updateCityDto: UpdateCityDto) {
    void updateCityDto;
    return `This action updates a #${id} city`;
  }

  async remove(id: string): Promise<void> {
    const city = await this.citiesRepository.findOne({ where: { id } });

    if (!city) {
      throw new NotFoundException(`City with id ${id} not found`);
    }

    await this.citiesRepository.remove(city);
  }
}
