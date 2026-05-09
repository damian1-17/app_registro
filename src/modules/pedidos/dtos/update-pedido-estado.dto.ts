import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoPedido } from '../entities/pedido.entity';

export class UpdatePedidoEstadoDto {
  @ApiProperty({ 
    enum: EstadoPedido,
    example: EstadoPedido.CONFIRMADO 
  })
  @IsEnum(EstadoPedido)
  estado: EstadoPedido;
}