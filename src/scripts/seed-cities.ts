import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { DataSource } from 'typeorm';
import { AppDataSource } from '../config/ormconfig';
import { City } from '../cities/entities/city.entity';

interface RawCity {
  coords: { lat: string; lon: string };
  district: string;
  name: string;
  population: number;
  subject: string;
}

export async function seedCities(
  dataSource: DataSource = AppDataSource,
): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const citiesRepository = dataSource.getRepository(City);
  const filePath = join(__dirname, 'data', 'russian-cities.json');
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as RawCity[];

  const existing = await citiesRepository.find({
    select: { name: true, subject: true },
  });
  const existingKeys = new Set(
    existing.map((c) => `${c.name}::${c.subject ?? ''}`),
  );

  const toInsert = raw
    .filter((c) => !existingKeys.has(`${c.name}::${c.subject}`))
    .map((c) => ({
      name: c.name,
      district: c.district,
      subject: c.subject,
      lat: Number(c.coords.lat),
      lon: Number(c.coords.lon),
      population: c.population,
    }));

  if (toInsert.length === 0) {
    console.log('Все города уже в базе, пропускаем.');
    return;
  }

  await citiesRepository.save(citiesRepository.create(toInsert), {
    chunk: 100,
  });
  console.log(`Seeded ${toInsert.length} cities (из ${raw.length} в JSON)`);
}

async function runSeedCities(): Promise<void> {
  try {
    await seedCities();
  } catch (error: unknown) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  void runSeedCities();
}
