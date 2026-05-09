import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class ProductoResponseDto {
  @ApiProperty()
  @Expose()
  idProducto: number;

  @ApiProperty()
  @Expose()
  nombre: string;

  @ApiProperty()
  @Expose()
  descripcion: string;

  @ApiProperty()
  @Expose()
  precio: number;

  @ApiProperty()
  @Expose()
  activo: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}

export class PaginatedProductosResponseDto {
  @ApiProperty({ type: [ProductoResponseDto] })
  data: ProductoResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}