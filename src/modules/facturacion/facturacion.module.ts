import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturacionService } from './services/facturacion.service';
import { FacturacionController } from './controllers/facturacion.controller';
import { Factura } from './entities/factura.entity';
import { DetalleFactura } from './entities/detalle-factura.entity';
import { PedidoFacturacionIntegrationService } from './services/pedido-facturacion-integration.service';

import { PedidosModule } from '@/modules/pedidos/pedidos.module';
import { Producto } from '@/modules/productos/entities/producto.entity';
import { PedidoAprobadoListener } from './listeners/pedido-aprobado.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Factura, DetalleFactura],
      'FACTURACION_DB',
    ),
    TypeOrmModule.forFeature([Producto], 'PEDIDOS_DB'),

    PedidosModule, // 🔥🔥🔥 OBLIGATORIO
  ],
  controllers: [FacturacionController],
  providers: [
    FacturacionService,
    PedidoFacturacionIntegrationService,
    PedidoAprobadoListener, // ← Agregar el listener

  ],
})
export class FacturacionModule { }
