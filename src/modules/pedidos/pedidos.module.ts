import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosService } from './services/pedidos.service';
import { PedidosController } from './controllers/pedidos.controller';
import { Pedido } from './entities/pedido.entity';
import { PedidoDetalle } from './entities/pedido-detalle.entity';
import { ProductosModule } from '@/modules/productos/productos.module';
import { AuditoriaModule } from '@/modules/auditoria/auditoria.module';
import { Usuario } from '@/modules/auth/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, PedidoDetalle,Usuario], 'PEDIDOS_DB'),
    ProductosModule, // Importar para usar ProductosService
    AuditoriaModule,
    PedidosModule, // Importar para usar PedidosService en auditoría
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService, TypeOrmModule],
})
export class PedidosModule { }