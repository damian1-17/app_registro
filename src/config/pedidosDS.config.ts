// src/config/pedidosDS.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const pedidosDS: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.PEDIDOS_DB_HOST,
  port: Number(process.env.PEDIDOS_DB_PORT),
  username: process.env.PEDIDOS_DB_USER,
  password: process.env.PEDIDOS_DB_PASS,
  database: process.env.PEDIDOS_DB_NAME,
  synchronize: false,
  logging: true,
};