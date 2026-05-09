// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { pedidosDS } from '@/config/pedidosDS.config';
import { facturacionDS } from '@/config/facturacionDS.config';
import { seguridadDS } from '@/config/seguridadDS.config';
import { DatabaseService } from './services/database.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...pedidosDS, name: 'PEDIDOS_DB' }),
    TypeOrmModule.forRoot({ ...facturacionDS, name: 'FACTURACION_DB' }),
    TypeOrmModule.forRoot({ ...seguridadDS, name: 'SEGURIDAD_DB' }),],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule { }