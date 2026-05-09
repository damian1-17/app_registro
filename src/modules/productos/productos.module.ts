import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosService } from './services/productos.service';
import { ProductosController } from './controllers/productos.controller';
import { Producto } from './entities/producto.entity';
import { AuditoriaModule } from '@/modules/auditoria/auditoria.module';

@Module({
  imports: [TypeOrmModule.forFeature([Producto], 'PEDIDOS_DB'),
    AuditoriaModule
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService], // Exportar para usar en PedidosModule
})
export class ProductosModule { }