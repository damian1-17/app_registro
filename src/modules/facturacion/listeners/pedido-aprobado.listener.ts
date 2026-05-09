import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FacturacionService } from '../services/facturacion.service';
import { PedidoFacturacionIntegrationService } from '@/modules/facturacion/services/pedido-facturacion-integration.service';






/**
 * Listener que escucha eventos del módulo de pedidos
 * y genera facturas automáticamente
 */
@Injectable()
export class PedidoAprobadoListener {
  private readonly logger = new Logger(PedidoAprobadoListener.name);

  constructor(
    private readonly facturacionService: FacturacionService,
    private readonly pedidoIntegrationService: PedidoFacturacionIntegrationService,
  ) { }

  @OnEvent('pedido.aprobado')
  async handlePedidoAprobado(event: { idPedido: number; supervisorId: number }) {
    this.logger.log(`📨 Evento recibido: Pedido #${event.idPedido} aprobado por supervisor #${event.supervisorId}`);

    try {
      // Obtener datos del pedido desde PEDIDOS_DB
      const pedidoData = await this.pedidoIntegrationService.obtenerDatosPedido(event.idPedido);

      this.logger.log(`📋 Datos del pedido obtenidos. Cliente: ${pedidoData.nombreCliente}`);

      // Generar factura automática
      const factura = await this.facturacionService.generarFacturaAutomatica(
        event.idPedido,
        pedidoData,
      );

      this.logger.log(`✅ Factura ${factura.numeroFactura} generada exitosamente para pedido #${event.idPedido}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `❌ Error generando factura para pedido #${event.idPedido}: ${errorMessage}`,
        errorStack,
      );
      // No lanzamos el error para no afectar el proceso de aprobación del pedido
    }
  }
}