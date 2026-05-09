// src/config/facturacionDS.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const facturacionDS: TypeOrmModuleOptions = {
  name: 'facturacion',
  type: 'postgres',
  host: process.env.FACTURACION_DB_HOST,
  port: Number(process.env.FACTURACION_DB_PORT),
  username: process.env.FACTURACION_DB_USER,
  password: process.env.FACTURACION_DB_PASS,
  database: process.env.FACTURACION_DB_NAME,
  synchronize: false,
  logging: true,
};