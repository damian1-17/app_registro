import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiQuery } from '@nestjs/swagger';
import { ProductosService } from '../services/productos.service';
import { CreateProductoDto } from '../dtos/create-producto.dto';
import { UpdateProductoDto } from '../dtos/update-producto.dto';
import { FilterProductoDto } from '../dtos/filter-producto.dto';
import { ProductoResponseDto, PaginatedProductosResponseDto } from '../dtos/response/producto-response.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Productos')
@Controller('productos')
@ApiCookieAuth('accessToken')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @Roles('admin')
  @Permissions('products:create')
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente', type: ProductoResponseDto })
  @ApiResponse({ status: 400, description: 'Ya existe un producto con ese nombre' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async create(@Body() createProductoDto: CreateProductoDto): Promise<ProductoResponseDto> {
    return this.productosService.create(createProductoDto);
  }

  @Get()
  @Public() // Permitir ver productos sin autenticación
  @ApiOperation({ summary: 'Obtener todos los productos con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de productos', type: PaginatedProductosResponseDto })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre' })
  @ApiQuery({ name: 'activo', required: false, description: 'Filtrar por estado activo' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Productos por página', example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Campo para ordenar', example: 'nombre' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Orden ASC o DESC', example: 'ASC' })
  async findAll(@Query() filters: FilterProductoDto): Promise<PaginatedProductosResponseDto> {
    return this.productosService.findAll(filters);
  }

  @Get(':id')
  @Public() // Permitir ver detalle sin autenticación
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado', type: ProductoResponseDto })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductoResponseDto> {
    return this.productosService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @Permissions('products:update')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado', type: ProductoResponseDto })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 400, description: 'Ya existe un producto con ese nombre' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto,
  ): Promise<ProductoResponseDto> {
    return this.productosService.update(id, updateProductoDto);
  }

  @Delete(':id')
  @Roles('admin')
  @Permissions('products:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ status: 204, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    
    return this.productosService.remove(id);
  }

  @Patch(':id/toggle-activo')
  @Roles('admin')
  @Permissions('products:update')
  @ApiOperation({ summary: 'Activar/Desactivar un producto' })
  @ApiResponse({ status: 200, description: 'Estado del producto actualizado', type: ProductoResponseDto })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async toggleActivo(@Param('id', ParseIntPipe) id: number): Promise<ProductoResponseDto> {
    return this.productosService.toggleActivo(id);
  }
}
