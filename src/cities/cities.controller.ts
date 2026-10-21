// src/cities/cities.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.enums';
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { GetCitiesDto } from './dto/get-cities.dto';
import { CityResponseDto } from './dto/city-response.dto';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать новый город (только для админа)' })
  @ApiResponse({
    status: 201,
    description: 'Город успешно создан',
    type: CityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав (не админ)' })
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список городов с поиском' })
  @ApiResponse({
    status: 200,
    description: 'Список городов',
    type: [CityResponseDto],
  })
  findAll(@Query() query: GetCitiesDto) {
    return this.citiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить город по ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID города',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Город найден',
    type: CityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Город не найден' })
  findOne(@Param('id') id: string) {
    return this.citiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить город по ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID города',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Город обновлён',
    type: CityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Город не найден' })
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.citiesService.update(id, updateCityDto);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить город (только для админа)' })
  @ApiParam({
    name: 'id',
    description: 'UUID города',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 204, description: 'Город удалён' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточно прав (не админ)' })
  @ApiResponse({ status: 404, description: 'Город не найден' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.citiesService.remove(id);
  }
}