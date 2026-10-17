import { ConflictException, Injectable } from '@nestjs/common';
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

  remove(id: string) {
    return `This action removes a #${id} city`;
  }
}
