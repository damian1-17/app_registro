// src/modules/qr/dto/escanear-qr.dto.ts
import { IsUUID, IsInt, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TipoQrResponseDto } from './tipo-qr.dto';

export class EscanearQrDto {
  @ApiProperty({
    description: 'Token UUID extraído del QR',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  token!: string;

  @ApiPropertyOptional({
    description: 'ID del staff que escanea (para auditoría)',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  idStaff?: number;
}

export class ResultadoEscaneoDto {
  @Expose() valido!: boolean;
  @Expose() mensaje!: string;
  @Expose() idUsuarioQr?: string;
  @Expose() idUsuario?: number;
  @Expose() estado?: string;
  @Expose() fechaUso?: Date;

  @Expose()
  @Type(() => TipoQrResponseDto)
  tipoQr?: TipoQrResponseDto;
}