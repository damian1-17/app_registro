import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Producto } from '../entities/producto.entity';
import { CreateProductoDto } from '../dtos/create-producto.dto';
import { UpdateProductoDto } from '../dtos/update-producto.dto';
import { FilterProductoDto } from '../dtos/filter-producto.dto';
import { plainToClass } from 'class-transformer';
import { ProductoResponseDto, PaginatedProductosResponseDto } from '../dtos/response/producto-response.dto';
import { AuditoriaService } from '@/modules/auditoria/services/auditoria.service';
import { AccionAuditoria } from '@/modules/auditoria/entities/auditoria.entity';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto, 'PEDIDOS_DB')
    private readonly productoRepository: Repository<Producto>,
    private readonly auditoriaService: AuditoriaService,
  ) { }

  async create(createProductoDto: CreateProductoDto): Promise<ProductoResponseDto> {
    // Verificar que no exista un producto con el mismo nombre
    const existe = await this.productoRepository.findOne({
      where: { nombre: createProductoDto.nombre },
    });

    if (existe) {
      throw new BadRequestException('Ya existe un producto con ese nombre');
    }

    const producto = this.productoRepository.create(createProductoDto);
    const saved = await this.productoRepository.save(producto);


    //auditoria
    await this.auditoriaService.registrar({
      entidad: 'productos',
      idEntidad: saved.idProducto,
      accion: AccionAuditoria.CREAR,
      datosNuevos: saved,
      detalles: `Producto "${saved.nombre}" creado`,
    });
    return plainToClass(ProductoResponseDto, saved, { excludeExtraneousValues: true });
  }



  async findAll(filters: FilterProductoDto): Promise<PaginatedProductosResponseDto> {
    const { search, activo, page, limit, sortBy, sortOrder } = filters;

    const where: FindOptionsWhere<Producto> = {};

    // Filtro por nombre (búsqueda)
    if (search) {
      where.nombre = Like(`%${search}%`);
    }

    // Filtro por activo
    if (activo !== undefined) {
      where.activo = activo;
    }

    if (!limit || limit <= 0) {
      throw new BadRequestException('El límite debe ser un número positivo mayor que cero');
    }
    if (!page || page <= 0) {
      throw new BadRequestException('La página debe ser un número positivo mayor que cero');
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Validar sortBy si se proporciona
    const allowedSortFields = ['id', 'nombre', 'precio', 'stock', 'activo', 'createdAt', 'updatedAt'];
    const finalSortBy = sortBy || 'id'; // Valor por defecto si no se proporciona

    if (!allowedSortFields.includes(finalSortBy)) {
      throw new BadRequestException(
        `Campo de ordenamiento inválido. Campos permitidos: ${allowedSortFields.join(', ')}`
      );
    }

    const [productos, total] = await this.productoRepository.findAndCount({
      where,
      order: { [finalSortBy]: sortOrder || 'ASC' }, // También orden por defecto
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: productos.map(p => plainToClass(ProductoResponseDto, p, { excludeExtraneousValues: true })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number): Promise<ProductoResponseDto> {
    const producto = await this.productoRepository.findOne({
      where: { idProducto: id },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return plainToClass(ProductoResponseDto, producto, { excludeExtraneousValues: true });
  }

  async update(id: number, updateProductoDto: UpdateProductoDto): Promise<ProductoResponseDto> {
    const producto = await this.productoRepository.findOne({
      where: { idProducto: id },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    const productAnterior = { ...producto }; // Guardar estado anterior

    // Si se está actualizando el nombre, verificar que no exista otro con ese nombre
    if (updateProductoDto.nombre && updateProductoDto.nombre !== producto.nombre) {
      const existe = await this.productoRepository.findOne({
        where: { nombre: updateProductoDto.nombre },
      });

      if (existe) {
        throw new BadRequestException('Ya existe un producto con ese nombre');
      }
    }

    Object.assign(producto, updateProductoDto);
    const updated = await this.productoRepository.save(producto);


    // Auditoría
    await this.auditoriaService.registrar({
      entidad: 'productos',
      idEntidad: id,
      accion: AccionAuditoria.ACTUALIZAR,
      datosAnteriores: productAnterior,
      datosNuevos: updated,
      detalles: `Producto actualizado`,
    });
    return plainToClass(ProductoResponseDto, updated, { excludeExtraneousValues: true });
  }

  async remove(id: number): Promise<void> {
    const producto = await this.productoRepository.findOne({
      where: { idProducto: id },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    await this.productoRepository.remove(producto);
  }

  async toggleActivo(id: number): Promise<ProductoResponseDto> {
    const producto = await this.productoRepository.findOne({
      where: { idProducto: id },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    producto.activo = !producto.activo;
    const updated = await this.productoRepository.save(producto);

    return plainToClass(ProductoResponseDto, updated, { excludeExtraneousValues: true });
  }

  // Métodos auxiliares para el maestro-detalle de pedidos
  async findByIds(ids: number[]): Promise<Producto[]> {
    return this.productoRepository.findByIds(ids);
  }

  async verificarStock(id: number): Promise<boolean> {
    const producto = await this.productoRepository.findOne({
      where: { idProducto: id, activo: true },
    });

    return !!producto;
  }
}