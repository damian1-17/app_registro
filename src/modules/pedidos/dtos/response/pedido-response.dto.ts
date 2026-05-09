import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { EstadoPedido, MetodoPago } from '../../entities/pedido.entity';

export class PedidoDetalleResponseDto {
  @ApiProperty()
  @Expose()
  idDetalle: number;

  @ApiProperty()
  @Expose()
  idProducto: number;

  @ApiProperty()
  @Expose()
  nombreProducto: string;

  @ApiProperty()
  @Expose()
  cantidad: number;

  @ApiProperty()
  @Expose()
  precioUnitario: number;

  @ApiProperty()
  @Expose()
  subtotal: number;
}

export class PedidoResponseDto {
  @ApiProperty()
  @Expose()
  idPedido: number;

  @ApiProperty()
  @Expose()
  idCliente: number;
  

  @ApiProperty()
  @Expose()
  cedula: string;

  @ApiProperty()
  @Expose()
  nombreCliente: string;

  @ApiProperty()
  @Expose()
  fecha: Date;

  @ApiProperty({ enum: EstadoPedido })
  @Expose()
  estado: EstadoPedido;

  @ApiProperty()
  @Expose()
  total: number;

  // ✅ NUEVOS CAMPOS
  @ApiProperty({ enum: MetodoPago })
  @Expose()
  metodoPago: MetodoPago;

  @ApiPropertyOptional()
  @Expose()
  direccion?: string;

  @ApiPropertyOptional()
  @Expose()
  observaciones?: string;

  @ApiProperty({ type: [PedidoDetalleResponseDto] })
  @Expose()
  @Type(() => PedidoDetalleResponseDto)
  detalles: PedidoDetalleResponseDto[];

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}

export class PaginatedPedidosResponseDto {
  @ApiProperty({ type: [PedidoResponseDto] })
  data: PedidoResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}


