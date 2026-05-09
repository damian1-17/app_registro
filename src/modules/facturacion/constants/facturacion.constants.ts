export const FACTURACION_CONSTANTS = {
  PREFIJO_FACTURA: 'FAC',
  IVA_PORCENTAJE_DEFAULT: 15,
  FORMA_PAGO_DEFAULT: 'efectivo',
  ESTADO_DEFAULT: 'emitida',
};

export enum EstadoFactura {
  EMITIDA = 'emitida',
  PAGADA = 'pagada',
  ANULADA = 'anulada',
}

export enum FormaPago {
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
  TRANSFERENCIA = 'transferencia',
  CREDITO = 'credito',
}