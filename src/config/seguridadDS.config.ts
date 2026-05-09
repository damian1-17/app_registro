// src/config/seguridadDS.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

console.log('SEGURIDAD_DB_HOST:', process.env.SEGURIDAD_DB_HOST);
console.log('SEGURIDAD_DB_PORT:', process.env.SEGURIDAD_DB_PORT);
console.log('SEGURIDAD_DB_USER:', process.env.SEGURIDAD_DB_USER);

export const seguridadDS: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.SEGURIDAD_DB_HOST,
  port: Number(process.env.SEGURIDAD_DB_PORT),
  username: process.env.SEGURIDAD_DB_USER,
  password: String(process.env.SEGURIDAD_DB_PASS),
  database: process.env.SEGURIDAD_DB_NAME,
  synchronize: false,
  logging: true,
  ssl: { rejectUnauthorized: false },
};