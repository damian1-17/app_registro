import { IsString, IsNumber, IsBoolean, IsOptional, MinLength, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({ example: 'Laptop Dell XPS 15' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({ example: 'Laptop de alto rendimiento con procesador Intel i7' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: 1299.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}