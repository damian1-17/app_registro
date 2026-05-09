import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccionAuditoria, TablasAuditoria } from '../entities/auditoria.entity';

export class FilterAuditoriaDto {
  @ApiPropertyOptional({ enum: TablasAuditoria })
  @IsOptional()
  @IsString()
  @IsEnum(TablasAuditoria)
  entidad?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  idEntidad?: string;

  @ApiPropertyOptional({ enum: AccionAuditoria })
  @IsOptional()
  @IsEnum(AccionAuditoria)
  accion?: AccionAuditoria;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  usuarioId?: number;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}