// src/modules/qr/dto/query-qr.dto.ts
import { IsOptional, IsString, IsInt, IsPositive, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EstadoQr } from '../entities/usuario-qr.entity';

export class QueryTiposQrDto {
  @ApiPropertyOptional({ example: 'almuerzo' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryUsuarioQrDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  idUsuario?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  idTipoQr?: number;

  @ApiPropertyOptional({ enum: EstadoQr })
  @IsOptional()
  @IsEnum(EstadoQr)
  estado?: EstadoQr;
}