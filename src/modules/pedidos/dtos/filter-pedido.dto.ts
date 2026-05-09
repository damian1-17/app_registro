import { IsOptional, IsEnum, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPedido } from '../entities/pedido.entity';

export class FilterPedidoDto {
  @ApiPropertyOptional({ enum: EstadoPedido })
  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'fecha', enum: ['fecha', 'total', 'estado'] })
  @IsOptional()
  sortBy?: string = 'fecha';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}