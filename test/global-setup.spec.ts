import { DataSource } from 'typeorm';
import { dbConfig } from '../src/config/db.config';
import { seedAdmin } from '../src/scripts/seed-admin';
import { seedCities } from '../src/scripts/seed-cities';
import { seedSkills } from '../src/scripts/seed-skills';
import { seedUsers } from '../src/scripts/seed-users';
import prepareTestDatabase from './global-setup';

jest.mock('./setup-env', () => ({}));
jest.mock('typeorm', () => ({ DataSource: jest.fn() }));
jest.mock('../src/config/db.config', () => ({ dbConfig: jest.fn() }));
jest.mock('../src/scripts/seed-admin', () => ({ seedAdmin: jest.fn() }));
jest.mock('../src/scripts/seed-cities', () => ({ seedCities: jest.fn() }));
jest.mock('../src/scripts/seed-skills', () => ({ seedSkills: jest.fn() }));
jest.mock('../src/scripts/seed-users', () => ({ seedUsers: jest.fn() }));

describe('E2E database preparation', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const initialize = jest.fn();
  const query = jest.fn();
  const synchronize = jest.fn();
  const destroy = jest.fn();
  const configMock = jest.mocked(dbConfig);
  const dataSourceMock = jest.mocked(DataSource);
  const citiesMock = jest.mocked(seedCities);
  const adminMock = jest.mocked(seedAdmin);
  const usersMock = jest.mocked(seedUsers);
  const skillsMock = jest.mocked(seedSkills);

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.NODE_ENV = 'test';
    configMock.mockReturnValue({
      type: 'postgres',
      url: 'postgresql://postgres:postgres@localhost:5432/test',
      synchronize: true,
    });
    dataSourceMock.mockImplementation(
      () =>
        ({ initialize, query, synchronize, destroy }) as unknown as DataSource,
    );
    initialize.mockResolvedValue(undefined);
    synchronize.mockResolvedValue(undefined);
    destroy.mockResolvedValue(undefined);
    query
      .mockResolvedValueOnce([{ name: 'test' }])
      .mockResolvedValueOnce([
        { name: 'public.users' },
        { name: 'public.skills' },
      ])
      .mockResolvedValueOnce(undefined);
    citiesMock.mockResolvedValue(undefined);
    adminMock.mockResolvedValue(undefined);
    usersMock.mockResolvedValue(undefined);
    skillsMock.mockResolvedValue({ created: 2, skipped: 0 });
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('rejects a development database before opening a connection', async () => {
    configMock.mockReturnValue({
      type: 'postgres',
      url: 'postgresql://postgres:postgres@localhost:5432/skillswap',
    });

    await expect(prepareTestDatabase()).rejects.toThrow('отдельной базе test');
    expect(dataSourceMock).not.toHaveBeenCalled();
  });

  it('rejects cleanup outside the test environment', async () => {
    process.env.NODE_ENV = 'production';

    await expect(prepareTestDatabase()).rejects.toThrow(
      'тестовой PostgreSQL-базы test',
    );
    expect(dataSourceMock).not.toHaveBeenCalled();
  });

  it('rejects invalid connection URLs without attempting to connect', async () => {
    configMock.mockReturnValue({ type: 'postgres', url: 'invalid-url' });

    await expect(prepareTestDatabase()).rejects.toThrow('Некорректный URL');
    expect(dataSourceMock).not.toHaveBeenCalled();
  });

  it('rejects a non-PostgreSQL connection scheme', async () => {
    configMock.mockReturnValue({
      type: 'postgres',
      url: 'https://localhost/test',
    });

    await expect(prepareTestDatabase()).rejects.toThrow('отдельной базе test');
    expect(dataSourceMock).not.toHaveBeenCalled();
  });

  it('checks the actual database before cleanup or schema synchronization', async () => {
    query.mockReset().mockResolvedValueOnce([{ name: 'skillswap' }]);

    await expect(prepareTestDatabase()).rejects.toThrow(
      'фактическая база данных не test',
    );
    expect(query).toHaveBeenCalledTimes(1);
    expect(synchronize).not.toHaveBeenCalled();
    expect(citiesMock).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('cleans all related tables before synchronizing and running every seed', async () => {
    await prepareTestDatabase();

    expect(dataSourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        synchronize: false,
        migrationsRun: false,
        dropSchema: false,
      }),
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      'TRUNCATE TABLE public.users, public.skills RESTART IDENTITY CASCADE',
    );
    expect(query.mock.invocationCallOrder[2]).toBeLessThan(
      synchronize.mock.invocationCallOrder[0],
    );
    expect(synchronize.mock.invocationCallOrder[0]).toBeLessThan(
      citiesMock.mock.invocationCallOrder[0],
    );
    expect(citiesMock.mock.invocationCallOrder[0]).toBeLessThan(
      adminMock.mock.invocationCallOrder[0],
    );
    expect(adminMock.mock.invocationCallOrder[0]).toBeLessThan(
      usersMock.mock.invocationCallOrder[0],
    );
    expect(usersMock.mock.invocationCallOrder[0]).toBeLessThan(
      skillsMock.mock.invocationCallOrder[0],
    );
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('prepares a new database with no existing tables', async () => {
    query
      .mockReset()
      .mockResolvedValueOnce([{ name: 'test' }])
      .mockResolvedValueOnce([]);

    await prepareTestDatabase();

    expect(query).toHaveBeenCalledTimes(2);
    expect(synchronize).toHaveBeenCalledTimes(1);
    expect(skillsMock).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('respects a configuration with schema synchronization disabled', async () => {
    configMock.mockReturnValue({
      type: 'postgres',
      url: 'postgresql://postgres:postgres@localhost:5432/test',
      synchronize: false,
    });

    await prepareTestDatabase();

    expect(synchronize).not.toHaveBeenCalled();
    expect(skillsMock).toHaveBeenCalledTimes(1);
  });

  it('stops seeding and closes the connection if cleanup fails', async () => {
    query
      .mockReset()
      .mockResolvedValueOnce([{ name: 'test' }])
      .mockResolvedValueOnce([{ name: 'public.users' }])
      .mockRejectedValueOnce(new Error('cleanup failed'));

    await expect(prepareTestDatabase()).rejects.toThrow('cleanup failed');
    expect(citiesMock).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('does not continue to later seeds after a seed fails', async () => {
    citiesMock.mockRejectedValueOnce(new Error('cities seed failed'));

    await expect(prepareTestDatabase()).rejects.toThrow('cities seed failed');
    expect(adminMock).not.toHaveBeenCalled();
    expect(usersMock).not.toHaveBeenCalled();
    expect(skillsMock).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
