// src/modules/qr/dto/asignar-qr-a-rol.dto.ts
import { IsInt, IsPositive, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarQrARolDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  idTipoQr: number;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiracion?: string;
}