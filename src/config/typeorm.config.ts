// src/typeorm.config.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

import { pedidosDS }     from '@/config/pedidosDS.config';
import { facturacionDS } from '@/config/facturacionDS.config';
import { seguridadDS }   from '@/config/seguridadDS.config';

config();

export const PedidosDataSource = new DataSource({
  ...(pedidosDS as any),
  entities:   ['src/pedidos/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/pedidos/*{.ts,.js}'],
});

export const FacturacionDataSource = new DataSource({
  ...(facturacionDS as any),
  entities:   ['src/facturacion/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/facturacion/*{.ts,.js}'],
});

export const SeguridadDataSource = new DataSource({
  ...(seguridadDS as any),
  entities:   ['src/seguridad/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/seguridad/*{.ts,.js}'],
});

export default SeguridadDataSource;