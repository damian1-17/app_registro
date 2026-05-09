// src/modules/pedidos/events/pedido-aprobado.event.ts
export class PedidoAprobadoEvent {
  constructor(
    public readonly idPedido: number,
    public readonly supervisorId: number,
  ) {}
}