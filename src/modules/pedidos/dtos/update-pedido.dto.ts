import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago } from '../entities/pedido.entity';

export class UpdatePedidoDto {
  @ApiPropertyOptional({ 
    enum: MetodoPago,
    description: 'Método de pago del pedido'
  })
  @IsEnum(MetodoPago)
  @IsOptional()
  metodoPago?: MetodoPago;

  @ApiPropertyOptional({ 
    description: 'Dirección de entrega'
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  direccion?: string;

  @ApiPropertyOptional({ 
    description: 'Observaciones adicionales'
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observaciones?: string;
}
