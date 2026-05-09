import { IsArray, ArrayMinSize, ValidateNested, IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePedidoDetalleDto } from './create-pedido-detalle.dto';
import { MetodoPago } from '../entities/pedido.entity';

export class CreatePedidoDto {
  @ApiProperty({
    type: [CreatePedidoDetalleDto],
    example: [
      { idProducto: 1, cantidad: 2 },
      { idProducto: 3, cantidad: 1 }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoDetalleDto)
  detalles: CreatePedidoDetalleDto[];

  // ✅ NUEVOS CAMPOS
  @ApiProperty({
    enum: MetodoPago,
    example: MetodoPago.TARJETA,
    description: 'Método de pago del pedido'
  })
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  @ApiPropertyOptional({
    example: 'Calle Principal #123, Col. Centro, Ciudad',
    description: 'Dirección de entrega'
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  direccion?: string;

  @ApiPropertyOptional({
    example: 'Entregar entre 2pm y 5pm. Tocar el timbre 2 veces.',
    description: 'Observaciones adicionales'
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '0987654321',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  telefono?: string;


}