import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
  MaxLength,
  Length
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormaPago } from '../../constants/facturacion.constants';

export class DetalleFacturaDto {
  @ApiProperty({ description: 'ID del producto', example: 1 })
  @IsNumber()
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  idProducto: number;

  @ApiProperty({ description: 'Nombre del producto', example: 'Laptop Dell Inspiron 15', maxLength: 200 })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @MaxLength(200)
  nombreProducto: string;

  @ApiProperty({ description: 'Cantidad de unidades', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario del producto', example: 750.50, minimum: 0 })
  @IsNumber()
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  precioUnitario: number;

  @ApiPropertyOptional({ description: 'Descuento aplicado al detalle', example: 25.00, minimum: 0, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'El descuento no puede ser negativo' })
  descuento?: number;
}

export class CreateFacturaDto {
  @ApiPropertyOptional({ description: 'ID del cliente (opcional para clientes no registrados)', example: 123 })
  @IsNumber()
  @IsOptional()
  idCliente?: number | null;

  @ApiProperty({ description: 'Nombre completo del cliente', example: 'Juan Carlos Pérez González', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  @MaxLength(100)
  nombreCliente: string;

  @ApiProperty({ description: 'Cédula de identidad del cliente (10 dígitos)', example: '1234567890' })
  @IsString()
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @Length(10, 10, { message: 'La cédula debe tener 10 dígitos' })
  cedula: string;

  @ApiPropertyOptional({ description: 'Dirección del cliente', example: 'Av. 6 de Diciembre N34-150', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  direccion?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto del cliente', example: '0987654321', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  telefono?: string;

  @ApiPropertyOptional({ description: 'Email del cliente', example: 'juan.perez@email.com', maxLength: 100 })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ description: 'Forma de pago de la factura', enum: FormaPago, example: FormaPago.EFECTIVO })
  @IsEnum(FormaPago, { message: 'Forma de pago no válida' })
  formaPago: FormaPago;

  @ApiProperty({
    description: 'Detalles de los productos en la factura',
    type: [DetalleFacturaDto],
    minItems: 1,
    example: [
      { idProducto: 1, nombreProducto: 'Laptop Dell Inspiron 15', cantidad: 2, precioUnitario: 750.50, descuento: 25.00 },
      { idProducto: 2, nombreProducto: 'Mouse Logitech', cantidad: 1, precioUnitario: 15.99, descuento: 0 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un detalle' })
  @ValidateNested({ each: true })
  @Type(() => DetalleFacturaDto)
  detalles: DetalleFacturaDto[];

  @ApiPropertyOptional({ description: 'Descuento general aplicado a toda la factura', example: 50.00, minimum: 0, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'El descuento no puede ser negativo' })
  descuento?: number;

  @ApiPropertyOptional({ description: 'Observaciones o notas adicionales de la factura', example: 'Cliente frecuente' })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Latitud GPS capturada desde la app móvil', example: -0.1806532 })
  @IsNumber()
  @IsOptional()
  latitud?: number | null;

  @ApiPropertyOptional({ description: 'Longitud GPS capturada desde la app móvil', example: -78.4678123 })
  @IsNumber()
  @IsOptional()
  longitud?: number | null;

  @ApiPropertyOptional({
    description: 'Foto en Base64 capturada desde la cámara del móvil',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
  })
  @IsString()
  @IsOptional()
  @MaxLength(5_000_000, { message: 'La imagen no puede superar los ~3.7MB' })
  fotoBase64?: string | null;
}