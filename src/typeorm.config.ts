// src/typeorm.config.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { pedidosDS } from '@/config/pedidosDS.config';

config();

// ✅ Solo un export default
export default new DataSource({
  ...(pedidosDS as any),
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});