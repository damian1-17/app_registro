// src/modules/qr/dto/asignar-qr.dto.ts
import {
  IsInt,
  IsPositive,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** Asignar UN tipo de QR a UN usuario */
export class AsignarQrDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  @IsInt()
  @IsPositive()
  idUsuario: number;

  @ApiProperty({ example: 2, description: 'ID del tipo de QR' })
  @IsInt()
  @IsPositive()
  idTipoQr: number;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
    description: 'Fecha de expiración opcional',
  })
  @IsOptional()
  @IsDateString()
  expiracion?: string;
}

/** Asignar TODOS los tipos de QR activos a un usuario */
export class AsignarTodosQrDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  idUsuario: number;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiracion?: string;
}

/** Asignar QR en lote: lista de usuarios × lista de tipos */
export class AsignarQrLoteDto {
  @ApiProperty({ example: [1, 2, 3], description: 'IDs de usuarios' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  idUsuarios: number[];

  @ApiProperty({ example: [1, 2], description: 'IDs de tipos de QR' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  idTiposQr: number[];

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiracion?: string;
}

/** Cancelar un QR por su UUID de registro */
export class CancelarQrDto {
  @ApiProperty()
  @IsUUID()
  idUsuarioQr: string;
}