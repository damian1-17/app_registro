// src/modules/qr/dto/tipo-qr.dto.ts
import { Expose } from 'class-transformer';
import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTipoQrDto {
  @ApiProperty({ example: 'ALMUERZO' })
  @IsString()
  @MaxLength(50)
  codigo: string;

  @ApiProperty({ example: 'Almuerzo del evento' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: 'Válido para el almuerzo del día principal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiereUnicoUso?: boolean;
}

export class UpdateTipoQrDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiereUnicoUso?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class TipoQrResponseDto {
  @Expose()
  idTipoQr: number;

  @Expose()
  codigo: string;

  @Expose()
  nombre: string;

  @Expose()
  descripcion: string;

  @Expose()
  requiereUnicoUso: boolean;

  @Expose()
  activo: boolean;

  @Expose()
  createdAt: Date;
}