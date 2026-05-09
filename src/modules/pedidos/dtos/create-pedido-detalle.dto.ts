import { IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePedidoDetalleDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsNumber()
  @IsPositive()
  idProducto: number;

  @ApiProperty({ example: 2, description: 'Cantidad de productos' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  cantidad: number;
}