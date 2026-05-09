import { Expose, Type } from 'class-transformer';

export class DetalleFacturaResponseDto {
  @Expose()
  idDetalle: number;

  @Expose()
  idProducto: number;

  @Expose()
  nombreProducto: string;

  @Expose()
  cantidad: number;

  @Expose()
  precioUnitario: number;

  @Expose()
  descuento: number;

  @Expose()
  subtotal: number;
}

export class FacturaResponseDto {
  @Expose()
  idFactura: number;

  @Expose()
  idPedido: number | null;

  @Expose()
  numeroFactura: string;

  @Expose()
  idCliente: number;

  @Expose()
  nombreCliente: string;

  @Expose()
  cedula: string;

  @Expose()
  direccion: string;

  @Expose()
  telefono: string;

  @Expose()
  email: string;

  @Expose()
  fechaEmision: Date;

  @Expose()
  subtotal: number;

  @Expose()
  descuento: number;

  @Expose()
  porcentajeIva: number;

  @Expose()
  iva: number;

  @Expose()
  total: number;

  @Expose()
  formaPago: string;

  @Expose()
  estado: string;

  @Expose()
  observaciones: string;

  @Expose()
  fechaAutorizacion: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => DetalleFacturaResponseDto)
  detalles: DetalleFacturaResponseDto[];


  @Expose()
  latitud: number | null;

  @Expose()
  longitud: number | null;

  // ✅ Reemplaza por:
  @Expose()
  fotoBase64: string | null;
}

export class PaginatedFacturasResponseDto {
  @Expose()
  @Type(() => FacturaResponseDto)
  data: FacturaResponseDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;
}