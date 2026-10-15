import { Injectable } from '@nestjs/common';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CitiesService {
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

  remove(id: string) {
    return `This action removes a #${id} city`;
  }
}
