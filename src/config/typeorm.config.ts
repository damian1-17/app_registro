// src/typeorm.config.ts  ← solo para CLI, NestJS no lo toca
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { pedidosDS } from '@/config/pedidosDS.config';
import { facturacionDS } from '@/config/facturacionDS.config';
import { seguridadDS } from '@/config/seguridadDS.config';

config(); // carga el .env manualmente porque NestJS no está corriendo

export const PedidosDataSource = new DataSource({ ...pedidosDS, migrations: ['src/database/migrations/pedidos/*{.ts,.js}'] });
export const FacturacionDataSource = new DataSource({ ...facturacionDS, migrations: ['src/database/migrations/facturacion/*{.ts,.js}'] });
export const SeguridadDataSource = new DataSource({ ...seguridadDS, migrations: ['src/database/migrations/seguridad/*{.ts,.js}'] });
