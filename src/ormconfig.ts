import 'dotenv/config';
import { DataSource } from 'typeorm';

import { dbConfig } from './config/db.config';

export const AppDataSource = new DataSource(dbConfig());
