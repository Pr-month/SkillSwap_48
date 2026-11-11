import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import type { App } from 'supertest/types';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';

describe('GET /cities/:id', () => {
  let app: INestApplication<App>;
  const citiesRepository = { findOne: jest.fn() };
  const city: City = {
    id: '25ac8264-c483-4bee-8f43-3169e03c101c',
    name: 'Москва',
    district: 'Центральный',
    subject: 'Москва',
    lat: null,
    lon: null,
    population: 13000000,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CitiesController],
      providers: [
        CitiesService,
        { provide: getRepositoryToken(City), useValue: citiesRepository },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns the city found in the repository without requiring authorization', async () => {
    citiesRepository.findOne.mockResolvedValue(city);

    await request(app.getHttpServer())
      .get(`/cities/${city.id}`)
      .expect(200)
      .expect(city);

    expect(citiesRepository.findOne).toHaveBeenCalledWith({
      where: { id: city.id },
    });
  });

  it('returns 404 when no city has the requested UUID', async () => {
    citiesRepository.findOne.mockResolvedValue(null);

    await request(app.getHttpServer()).get(`/cities/${city.id}`).expect(404);

    expect(citiesRepository.findOne).toHaveBeenCalledWith({
      where: { id: city.id },
    });
  });

  it('rejects an invalid UUID before querying the repository', async () => {
    await request(app.getHttpServer()).get('/cities/not-a-uuid').expect(400);

    expect(citiesRepository.findOne).not.toHaveBeenCalled();
  });
});
