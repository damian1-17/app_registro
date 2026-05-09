import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadEvidenciaDto {
  @ApiProperty({
    description: 'Foto en formato Base64 capturada desde la cámara del móvil',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
  })
  @IsString()
  @IsNotEmpty({ message: 'La foto en base64 es obligatoria' })
  fotoBase64: string;

  @ApiPropertyOptional({
    description: 'Latitud GPS capturada desde la app móvil',
    example: -0.1806532,
  })
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @ApiPropertyOptional({
    description: 'Longitud GPS capturada desde la app móvil',
    example: -78.4678123,
  })
  @IsNumber()
  @IsOptional()
  longitud?: number;
}