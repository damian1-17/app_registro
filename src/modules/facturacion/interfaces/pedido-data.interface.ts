// src/modules/facturacion/interfaces/pedido-data.interface.ts
export interface PedidoDataParaFactura {
  idPedido: number;
  idCliente: number;
  nombreCliente: string;
  cedula: string;
  direccion: string | undefined;
  email: string | undefined;
  telefono: string | null;
  metodoPago: string;
  detalles: Array<{
    idProducto: number;
    nombreProducto: string;
    cantidad: number;
    precioUnitario: number;
  }>;
}