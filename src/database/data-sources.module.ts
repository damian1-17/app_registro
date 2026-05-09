import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule, InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { pedidosDS } from '@/config/pedidosDS.config';
import { facturacionDS } from '@/config/facturacionDS.config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...pedidosDS,
      name: 'PEDIDOS_DB',
    }),
    TypeOrmModule.forRoot({
      ...facturacionDS,
      name: 'FACTURACION_DB',
    }),
  ],
})
export class DataSources implements OnModuleInit {
  private readonly logger = new Logger('Database');

  constructor(
    @InjectDataSource('PEDIDOS_DB')
    private readonly pedidosDataSource: DataSource,

    @InjectDataSource('FACTURACION_DB')
    private readonly facturacionDataSource: DataSource,
  ) {}

  onModuleInit() {
    if (this.pedidosDataSource.isInitialized) {
      this.logger.log('✅ PEDIDOS DB conectada correctamente');
    }

    if (this.facturacionDataSource.isInitialized) {
      this.logger.log('✅ FACTURACIÓN DB conectada correctamente');
    }
  }
}
