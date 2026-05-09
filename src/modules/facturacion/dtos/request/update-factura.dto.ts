import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoFactura } from '../../constants/facturacion.constants';

export class UpdateFacturaDto {
  @IsEnum(EstadoFactura, { message: 'Estado de factura no válido' })
  @IsOptional()
  estado?: EstadoFactura;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsNumber()
  @IsOptional()
  latitud?: number | null;

  @IsNumber()
  @IsOptional()
  longitud?: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  fotoUrl?: string | null;

  @MaxLength(5_000_000, { message: 'La imagen no puede superar los ~3.7MB' })
  fotoBase64: string;
}